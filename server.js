function executeUsbMount(callback) {
  const exec = require('child_process').exec;
  const script = `
mkdir -p /media/usb
if grep -qs '/media/usb ' /proc/mounts; then
  echo "ALREADY_MOUNTED"
  exit 0
fi

MOUNTED=0
for dev in /dev/sda1 /dev/sdb1 /dev/sdc1 /dev/sda /dev/sdb /dev/sdc; do
  if [ -b "$dev" ]; then
    mount -o rw,umask=000 "$dev" /media/usb 2>/dev/null || \
    mount -t vfat -o rw,umask=000 "$dev" /media/usb 2>/dev/null || \
    mount -t ntfs -o rw "$dev" /media/usb 2>/dev/null || \
    mount -t ntfs-3g -o force,rw "$dev" /media/usb 2>/dev/null || \
    mount -t exfat -o rw,umask=000 "$dev" /media/usb 2>/dev/null || \
    mount -o ro "$dev" /media/usb 2>/dev/null || \
    mount "$dev" /media/usb 2>/dev/null
    
    if grep -qs '/media/usb ' /proc/mounts; then
      echo "MOUNTED_DEV:$dev"
      MOUNTED=1
      break
    fi
  fi
done

if [ $MOUNTED -eq 0 ]; then
  if [ -b /dev/sda1 ]; then
    mount /dev/sda1 /media/usb
  else
    echo "NO_BLOCK_DEVICE"
  fi
fi
`;

  exec(script, { shell: '/bin/bash' }, (err, stdout, stderr) => {
    exec("grep -qs '/media/usb ' /proc/mounts && echo 'YES' || echo 'NO'", (err2, stdout2) => {
      const isMounted = (stdout2 && stdout2.trim() === 'YES');
      if (isMounted) {
        callback(null, { mounted: true, info: stdout.trim() });
      } else {
        const details = stderr.trim() || stdout.trim() || 'No recognized USB block device (/dev/sda1)';
        callback(new Error(details), { mounted: false });
      }
    });
  });
}

// Ensure Asia/Bangkok Timezone for Industrial Logging (UTC+7)
process.env.TZ = 'Asia/Bangkok';

function getLocalLogTime(timestamp = Date.now()) {
  const d = new Date(timestamp);
  const pad = (n) => String(n).padStart(2, '0');
  
  const YYYY = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());

  return {
    dateStr: `${YYYY}-${MM}-${DD}`,
    timeStr: `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`
  };
}

// server.js – PID Tuning App Backend (24/7 Industrial Grade Self-Healing)
// Express + WebSocket + S7-1200 + FOPDT Simulator

const express  = require('express');
const http     = require('http');
const WebSocket = require('ws');
const path     = require('path');
const fs       = require('fs');

const { S7Client, DEFAULT_OFFSETS } = require('./src/s7client');
const Simulator = require('./src/simulator');

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const LOGS_DIR = path.join(__dirname, 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ═══════════════════════════════════════════════
// App State
// ═══════════════════════════════════════════════
let s7 = null;
let sim = null;
let appMode = 'disconnected';   // 'disconnected' | 'plc' | 'simulation' | 'reconnecting'
let blocks = {};                // blockId → block object
let appConfig = { plcIp: '192.168.121.211', plcRack: 0, plcSlot: 1 };

const BLOCKS_FILE = path.join(__dirname, 'data', 'blocks.json');
const CONFIG_FILE = path.join(__dirname, 'data', 'config.json');

function loadBlocks() {
  try {
    if (fs.existsSync(BLOCKS_FILE)) {
      blocks = JSON.parse(fs.readFileSync(BLOCKS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Failed to load blocks:', err);
  }
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      appConfig = { ...appConfig, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) };
    }
  } catch (err) {
    console.error('Failed to load config:', err);
  }
}

function saveBlocks() {
  try {
    if (!fs.existsSync(path.dirname(BLOCKS_FILE))) {
      fs.mkdirSync(path.dirname(BLOCKS_FILE), { recursive: true });
    }
    fs.writeFileSync(BLOCKS_FILE, JSON.stringify(blocks, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save blocks:', err);
  }
}

function saveConfig() {
  try {
    if (!fs.existsSync(path.dirname(CONFIG_FILE))) {
      fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(appConfig, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save config:', err);
  }
}

loadBlocks();
loadConfig();
let history = {};               // blockId → [{sp,pv,output,mode,timestamp}]
let pollerTimer = null;
const POLL_MS      = 500;       // Balanced 500ms (2Hz) High-Reliability Polling
const MAX_HISTORY  = 2000;

let lastLogTime = {};
let consecutiveErrors = 0;
let isConnecting = false;
let userDisconnected = false;   // Only true if user deliberately clicked Disconnect and auto-reconnect hasn't resumed

// ─── WebSocket broadcast ──────────────────────
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) {
      if (c.bufferedAmount > 1024 * 1024) {
        console.warn('[WebSocket] Client dropped due to high backpressure (RAM protection)');
        c.terminate();
      } else {
        c.send(msg);
      }
    }
  });
}

// ═══════════════════════════════════════════════
// S7-1200 Hardware RTC Time Sync (DB120 offset 0.0 DTL)
// ═══════════════════════════════════════════════
let lastSyncedPlcTime = '';
let syncRetryCount = 0;

async function syncTimeFromPLC() {
  if (!s7 || appMode !== 'plc') return;
  try {
    const plcTimeStr = await s7.readPlcDateTime(120, 0);
    if (!plcTimeStr) {
      if (syncRetryCount < 3) {
        syncRetryCount++;
      }
      return;
    }

    if (plcTimeStr === lastSyncedPlcTime) return;

    const plcTimestamp = new Date(plcTimeStr).getTime();
    const currentLinuxTimestamp = Date.now();

    if (Math.abs(currentLinuxTimestamp - plcTimestamp) < 3000) {
      lastSyncedPlcTime = plcTimeStr;
      return;
    }

    lastSyncedPlcTime = plcTimeStr;
    console.log(`[TimeSync] 🕒 Syncing Linux system time from S7-1200 (DB120): ${plcTimeStr}`);

    const cmd = `timedatectl set-ntp false 2>/dev/null || true; timedatectl set-timezone Asia/Bangkok 2>/dev/null || true; date -s "${plcTimeStr}" && hwclock -w >/dev/null 2>&1 || true`;
    require('child_process').exec(cmd, (err) => {
      if (!err) {
        console.log(`[TimeSync] ✅ Linux System Time Synced Successfully to: ${plcTimeStr}`);
        broadcast({ type: 'time_synced', time: plcTimeStr });
      }
    });
  } catch (err) {
    // Non-blocking
  }
}

// Periodic S7 Time Sync every 5 minutes
setInterval(syncTimeFromPLC, 5 * 60 * 1000);

// ─── Default block offsets ────────────────────
function defaultOffsets() {
  return { ...DEFAULT_OFFSETS };
}

// ═══════════════════════════════════════════════
// Autonomous Connection Core Function
// ═══════════════════════════════════════════════
async function connectToPlc(ip, rack = 0, slot = 1) {
  if (isConnecting) return false;
  isConnecting = true;
  try {
    if (s7) {
      try { s7.disconnect(); } catch (_) {}
      s7 = null;
    }

    const client = new S7Client();
    const connectPromise = client.connect({ host: ip, rack: parseInt(rack), slot: parseInt(slot) });
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('PLC Connection Timeout')), 4000));
    await Promise.race([connectPromise, timeoutPromise]);

    s7 = client;
    appMode = 'plc';
    consecutiveErrors = 0;
    userDisconnected = false;
    console.log(`[PLC Connection] ✅ Connected to S7-1200 at ${ip} (Rack ${rack}, Slot ${slot})`);
    
    broadcast({ type: 'status', connected: true, mode: 'plc', plcIp: ip });
    startPoller();
    // Trigger one initial time sync
    setTimeout(syncTimeFromPLC, 1000);
    return true;
  } catch (err) {
    if (s7) {
      try { s7.disconnect(); } catch (_) {}
      s7 = null;
    }
    if (appMode === 'plc') {
      appMode = 'disconnected';
      broadcast({ type: 'status', connected: false, mode: 'disconnected', reason: err.message });
    }
    throw err;
  } finally {
    isConnecting = false;
  }
}

// ═══════════════════════════════════════════════
// 24/7 Autonomous Background Auto-Reconnect Daemon
// ═══════════════════════════════════════════════
setInterval(() => {
  if (appMode === 'disconnected' || appMode === 'reconnecting') {
    if (appConfig.plcIp && !isConnecting && !userDisconnected) {
      connectToPlc(appConfig.plcIp, appConfig.plcRack, appConfig.plcSlot).catch(err => {
        // Silent retry
      });
    }
  }
}, 5000);

// Auto-connect on startup
if (appConfig.plcIp) {
  setTimeout(() => {
    console.log(`[Startup] 🚀 Auto-connecting to PLC at ${appConfig.plcIp}...`);
    connectToPlc(appConfig.plcIp, appConfig.plcRack, appConfig.plcSlot).catch(err => {
      console.warn(`[Startup] Initial connection pending (${err.message}). Background daemon will auto-retry.`);
    });
  }, 1000);
}

// ═══════════════════════════════════════════════
// REST API
// ═══════════════════════════════════════════════

// ── Connection ────────────────────────────────
app.post('/api/connect', async (req, res) => {
  const { ip, rack = 0, slot = 1 } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP address required' });

  appConfig.plcIp = ip;
  appConfig.plcRack = rack;
  appConfig.plcSlot = slot;
  saveConfig();
  userDisconnected = false;

  try {
    await connectToPlc(ip, rack, slot);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/connect', (req, res) => {
  try {
    userDisconnected = true;
    // Allow user to temporarily disconnect; auto-reconnect resumes after 30s of inactivity if not reconnected
    setTimeout(() => { userDisconnected = false; }, 30000);

    stopPoller();
    if (s7) {
      s7.disconnect();
      s7 = null;
    }
    appMode = 'disconnected';
    broadcast({ type: 'status', connected: false, mode: 'disconnected' });
    res.json({ success: true });
  } catch (err) {
    console.error('[Disconnect Error]:', err);
    broadcast({ type: 'status', connected: false, mode: 'disconnected' });
    res.json({ success: true });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    mode: appMode,
    connected: appMode === 'plc' || appMode === 'simulation',
    blockCount: Object.keys(blocks).length,
    defaultOffsets: DEFAULT_OFFSETS,
    plcConfig: appConfig
  });
});

// ── PID Blocks ────────────────────────────────
app.get('/api/blocks', (req, res) => {
  res.json({ blocks: Object.values(blocks) });
});

app.post('/api/blocks', (req, res) => {
  const { name, dbNumber, pvUnit = '', spUnit = '', outputUnit = '%', offsets, logInterval = 5, logPath = '', logAutoClearMonths = 12 } = req.body;
  if (!dbNumber) return res.status(400).json({ error: 'DB number required' });

  const id = `blk_${Date.now()}`;
  blocks[id] = {
    id,
    name:       name || `PID Loop ${Object.keys(blocks).length + 1}`,
    dbNumber:   parseInt(dbNumber),
    pvUnit,
    spUnit,
    outputUnit,
    offsets:    { ...defaultOffsets(), ...Object.fromEntries(Object.entries(offsets || {}).filter(([_, v]) => v !== '' && v !== null && v !== undefined)) },
    logInterval: parseInt(logInterval) || 5,
    logPath:     logPath,
    logAutoClearMonths: parseInt(logAutoClearMonths) || 12,
    params:     {},
    lastData:   null,
  };
  history[id] = [];

  if (appMode === 'simulation' && sim) {
    sim.addLoop(id, {
      kp:               (blocks[id].params.gain != null ? blocks[id].params.gain : 1),
      ti:               (blocks[id].params.ti != null ? blocks[id].params.ti : 10),
      td:               (blocks[id].params.td != null ? blocks[id].params.td : 0),
      setpoint:         (blocks[id].params.setpoint != null ? blocks[id].params.setpoint : 50),
      outputUpperLimit: (blocks[id].params.outputUpperLimit != null ? blocks[id].params.outputUpperLimit : 100),
      outputLowerLimit: (blocks[id].params.outputLowerLimit != null ? blocks[id].params.outputLowerLimit : 0),
    });
  }

  saveBlocks();
  res.json({ success: true, block: blocks[id] });
});

app.put('/api/blocks/:id', (req, res) => {
  const b = blocks[req.params.id];
  if (!b) return res.status(404).json({ error: 'Block not found' });

  const { name, dbNumber, pvUnit, spUnit, outputUnit, offsets, logInterval, logPath, logAutoClearMonths } = req.body;
  if (name)       b.name       = name;
  if (dbNumber)   b.dbNumber   = parseInt(dbNumber);
  if (pvUnit !== undefined)    b.pvUnit    = pvUnit;
  if (spUnit !== undefined)    b.spUnit    = spUnit;
  if (outputUnit !== undefined) b.outputUnit = outputUnit;
  if (offsets)    b.offsets    = { ...b.offsets, ...Object.fromEntries(Object.entries(offsets || {}).filter(([_, v]) => v !== '' && v !== null && v !== undefined)) };
  if (logInterval !== undefined) b.logInterval = parseInt(logInterval) || 5;
  if (logPath !== undefined)     b.logPath = logPath;
  if (logAutoClearMonths !== undefined) b.logAutoClearMonths = parseInt(logAutoClearMonths) || 12;

  saveBlocks();
  res.json({ success: true, block: b });
});

app.delete('/api/blocks/:id', (req, res) => {
  const { id } = req.params;
  if (!blocks[id]) return res.status(404).json({ error: 'Block not found' });

  if (sim) sim.removeLoop(id);
  delete blocks[id];
  delete history[id];
  saveBlocks();
  res.json({ success: true });
});

// ── Reorder Blocks ────────────────────────────
app.post('/api/blocks/reorder', (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'Order must be an array of IDs' });

  const newBlocks = {};
  order.forEach(id => {
    if (blocks[id]) {
      newBlocks[id] = blocks[id];
    }
  });
  Object.keys(blocks).forEach(id => {
    if (!newBlocks[id]) newBlocks[id] = blocks[id];
  });
  
  blocks = newBlocks;
  saveBlocks();
  res.json({ success: true, blocks: Object.values(blocks) });
});

// ── Read parameters from PLC ──────────────────
app.get('/api/blocks/:id/read', async (req, res) => {
  const b = blocks[req.params.id];
  if (!b) return res.status(404).json({ error: 'Block not found' });
  if (appMode !== 'plc' || !s7) return res.status(400).json({ error: 'Not connected to PLC' });

  try {
    const params = await s7.readPIDParams(b.dbNumber, b.offsets);
    b.params = params;
    saveBlocks();
    res.json({ success: true, params });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Write parameters to PLC ───────────────────
app.post('/api/blocks/:id/write', async (req, res) => {
  const b = blocks[req.params.id];
  if (!b) return res.status(404).json({ error: 'Block not found' });

  const { params } = req.body;

  if (appMode === 'plc' && s7) {
    try {
      await s7.writePIDParams(b.dbNumber, b.offsets, params);
      b.params = { ...b.params, ...params };
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else if (appMode === 'simulation' && sim) {
    sim.updatePID(req.params.id, {
      kp:               params.gain,
      ti:               params.ti,
      td:               params.td,
      setpoint:         params.setpoint,
      outputUpperLimit: params.outputUpperLimit,
      outputLowerLimit: params.outputLowerLimit,
    });
    b.params = { ...b.params, ...params };
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Not connected' });
  }
});

// ── Change PID Mode ───────────────────────────
app.post('/api/blocks/:id/mode', async (req, res) => {
  const b = blocks[req.params.id];
  if (!b) return res.status(404).json({ error: 'Block not found' });

  const { mode } = req.body;

  if (appMode === 'plc' && s7) {
    try {
      await s7.setMode(b.dbNumber, b.offsets, mode);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else if (appMode === 'simulation' && sim) {
    sim.setMode(req.params.id, mode);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Not connected' });
  }
});

// ── Setpoint write ────────────────────────────
app.post('/api/blocks/:id/setpoint', async (req, res) => {
  const b = blocks[req.params.id];
  if (!b) return res.status(404).json({ error: 'Block not found' });

  const { setpoint } = req.body;

  if (appMode === 'plc' && s7) {
    try {
      await s7.writeSetpoint(b.dbNumber, b.offsets, setpoint);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else if (appMode === 'simulation' && sim) {
    sim.setSetpoint(req.params.id, setpoint);
    b.params.setpoint = parseFloat(setpoint);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Not connected' });
  }
});

// ── Manual output write ───────────────────────
app.post('/api/blocks/:id/manual', async (req, res) => {
  const b = blocks[req.params.id];
  if (!b) return res.status(404).json({ error: 'Block not found' });

  const { value } = req.body;

  if (appMode === 'plc' && s7) {
    try {
      await s7.writeManualValue(b.dbNumber, b.offsets, value);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else if (appMode === 'simulation' && sim) {
    sim.setManualOutput(req.params.id, value);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Not connected' });
  }
});

// ── Error reset ───────────────────────────────
app.post('/api/blocks/:id/reset-error', async (req, res) => {
  const b = blocks[req.params.id];
  if (!b) return res.status(404).json({ error: 'Block not found' });
  if (appMode !== 'plc' || !s7) return res.status(400).json({ error: 'Not connected to PLC' });

  try {
    await s7.resetError(b.dbNumber, b.offsets);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Historical data ───────────────────────────
app.get('/api/blocks/:id/history', (req, res) => {
  const data = history[req.params.id] || [];
  const limit = parseInt(req.query.limit) || 600;
  res.json({ data: data.slice(-limit) });
});

app.delete('/api/blocks/:id/history', (req, res) => {
  if (history[req.params.id]) history[req.params.id] = [];
  res.json({ success: true });
});

// ── Simulation Control ────────────────────────
app.post('/api/simulation/start', (req, res) => {
  if (appMode === 'plc') return res.status(400).json({ error: 'Disconnect from PLC first' });

  const { processGain = 1, timeConstant = 10, deadTime = 2 } = req.body;

  sim = new Simulator({ processGain, timeConstant, deadTime });

  Object.keys(blocks).forEach(id => {
    const b = blocks[id];
    sim.addLoop(id, {
      kp:               (b.params.gain != null ? b.params.gain : 1),
      ti:               (b.params.ti != null ? b.params.ti : 10),
      td:               (b.params.td != null ? b.params.td : 0),
      setpoint:         (b.params.setpoint != null ? b.params.setpoint : 50),
      outputUpperLimit: (b.params.outputUpperLimit != null ? b.params.outputUpperLimit : 100),
      outputLowerLimit: (b.params.outputLowerLimit != null ? b.params.outputLowerLimit : 0),
    });
  });

  appMode = 'simulation';
  broadcast({ type: 'status', connected: true, mode: 'simulation' });
  startPoller();
  res.json({ success: true });
});

app.post('/api/simulation/stop', (req, res) => {
  stopPoller();
  if (sim) sim = null;
  appMode = 'disconnected';
  broadcast({ type: 'status', connected: false, mode: 'disconnected' });
  res.json({ success: true });
});

app.post('/api/simulation/process', (req, res) => {
  if (!sim) return res.status(400).json({ error: 'Simulation not running' });
  sim.updateProcess(req.body);
  res.json({ success: true });
});

// ── IMC Tuning calculator ─────────────────────
app.get('/api/tune/imc', (req, res) => {
  const K  = parseFloat(req.query.K)      || 1;
  const T  = parseFloat(req.query.T)      || 10;
  const L  = parseFloat(req.query.L)      || 2;
  const lam = parseFloat(req.query.lambda) || Math.max(T * 0.2, L);

  const Kp = T / (K * (lam + L));
  const Ti = T;
  const Td = L / 2;

  const rr  = L / T;
  const Kp_cc = (1 / K) * (T / L) * (4/3 + rr/4);
  const Ti_cc = L * (32 + 6*rr) / (13 + 8*rr);
  const Td_cc = 4 * L / (11 + 2*rr);

  const Kp_zn = 1.2 / (K * rr);
  const Ti_zn = 2 * L;
  const Td_zn = 0.5 * L;

  res.json({
    imc:         { kp: +Kp.toFixed(4),    ti: +Ti.toFixed(4),    td: +Td.toFixed(4),    lambda: lam },
    cohenCoon:   { kp: +Kp_cc.toFixed(4), ti: +Ti_cc.toFixed(4), td: +Td_cc.toFixed(4) },
    ziglerNichols:{ kp: +Kp_zn.toFixed(4),ti: +Ti_zn.toFixed(4), td: +Td_zn.toFixed(4) },
  });
});

// ═══════════════════════════════════════════════
// Robust Single-Packet Batch Polling Loop (500ms)
// ═══════════════════════════════════════════════
let isPolling = false;
function startPoller() {
  stopPoller();
  isPolling = false;
  consecutiveErrors = 0;

  pollerTimer = setInterval(async () => {
    if (isPolling) return; // Prevent overlapping ticks
    isPolling = true;

    try {
      if (appMode === 'plc') {
        if (!s7) return;

        // SINGLE-PACKET BATCH READ FOR ALL BLOCKS
        let batchResults = null;
        try {
          batchResults = await s7.readAllBlocksMonitorValues(blocks);
          consecutiveErrors = 0; // Reset error streak on success
        } catch (readErr) {
          consecutiveErrors++;
          console.warn(`[Poll] PLC read warning (Streak ${consecutiveErrors}): ${readErr.message}`);

          // Tolerates 1-2 minor hiccups. If 3 consecutive errors occur, trigger clean background socket reset
          if (consecutiveErrors >= 3) {
            console.error('[Poll] ⚠️ 3 consecutive PLC timeouts. Re-establishing socket in background...');
            if (s7) {
              try { s7.disconnect(); } catch (_) {}
              s7 = null;
            }
            appMode = 'reconnecting';
            broadcast({ type: 'status', connected: false, mode: 'reconnecting', reason: 'socket_reset' });
          }
          return;
        }

        if (!batchResults) return;

        const now = Date.now();
        const { dateStr, timeStr } = getLocalLogTime(now);

        for (const id of Object.keys(blocks)) {
          if (blocks[id].disabled) continue;
          const data = batchResults[id];
          if (!data) continue;

          const point = { ...data, timestamp: now };
          blocks[id].lastData = point;

          if (!history[id]) history[id] = [];
          history[id].push(point);
          if (history[id].length > MAX_HISTORY) history[id].shift();

          // ── 24/7 Data Logger (Non-blocking CSV Append) ──
          const intervalMs = (blocks[id].logInterval || 5) * 1000;
          if (now - (lastLogTime[id] || 0) >= intervalMs) {
            lastLogTime[id] = now;
            const blockNameSafe = blocks[id].name.replace(/\W+/g, '_');
            const fileName = `log_${blockNameSafe}_${dateStr}.csv`;
            
            let targetDir = LOGS_DIR;
            if (blocks[id].logPath && blocks[id].logPath.trim() !== '') {
              const p = blocks[id].logPath.trim();
              if (p === '/media/usb' || p === '/media/usb/' || p.startsWith('/media/usb')) {
                targetDir = LOGS_DIR;
              } else {
                targetDir = p;
                if (!fs.existsSync(targetDir)) {
                  try { fs.mkdirSync(targetDir, { recursive: true }); }
                  catch(e) { targetDir = LOGS_DIR; }
                }
              }
            }
            const filePath = path.join(targetDir, fileName);
            
            let line = '';
            if (!fs.existsSync(filePath)) {
              line += 'Time,Setpoint,ProcessValue,Output,Mode,State,ErrorBits\n';
            }
            const { sp, pv, output, mode, state, errorBits } = point;
            const fSp = Number(sp || 0).toFixed(2);
            const fPv = Number(pv || 0).toFixed(2);
            const fOut = Number(output || 0).toFixed(2);
            line += `${timeStr},${fSp},${fPv},${fOut},${mode},${state},${errorBits || 0}\n`;
            
            fs.appendFile(filePath, line, (err) => {
              if (err) console.error(`[Logger] Failed to write log for ${id}:`, err);
            });
          }

          broadcast({ type: 'data', blockId: id, ...point });
        }
      } else if (appMode === 'simulation' && sim) {
        const now = Date.now();
        for (const id of Object.keys(blocks)) {
          if (blocks[id].disabled) continue;
          const data = sim.step(id);
          if (!data) continue;

          const point = { ...data, timestamp: now };
          blocks[id].lastData = point;

          if (!history[id]) history[id] = [];
          history[id].push(point);
          if (history[id].length > MAX_HISTORY) history[id].shift();

          broadcast({ type: 'data', blockId: id, ...point });
        }
      }
    } finally {
      isPolling = false;
    }
  }, POLL_MS);
}

function stopPoller() {
  if (pollerTimer) { clearInterval(pollerTimer); pollerTimer = null; }
  isPolling = false;
}

// ═══════════════════════════════════════════════
// WebSocket Lifecycle
// ═══════════════════════════════════════════════
const pingInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => clearInterval(pingInterval));

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.send(JSON.stringify({
    type: 'status',
    connected: appMode === 'plc' || appMode === 'simulation',
    mode: appMode,
  }));

  ws.on('message', (data) => {
    ws.isAlive = true;
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch (e) {}
  });

  // Send latest data for all blocks
  Object.values(blocks).forEach(b => {
    if (b.lastData) {
      ws.send(JSON.stringify({ type: 'data', blockId: b.id, ...b.lastData }));
    }
  });
});

// ═══════════════════════════════════════════════
// Restart & Shutdown Endpoints
// ═══════════════════════════════════════════════
app.post('/api/restart', (req, res) => {
  console.log('[System] Restart requested via Web UI.');
  res.json({ status: 'restarting' });
  setTimeout(() => {
    require('child_process').exec('reboot', (err) => {
      if (err) console.error('Restart error:', err);
    });
  }, 2000);
});

app.post('/api/shutdown', (req, res) => {
  console.log('[System] Shutdown requested via Web UI. Waiting 10s...');
  res.json({ status: 'shutting_down' });
  setTimeout(() => {
    require('child_process').exec('poweroff', (err) => {
      if (err) console.error('Shutdown error:', err);
    });
  }, 10000);
});

// ═══════════════════════════════════════════════
// System Time Endpoints
// ═══════════════════════════════════════════════
app.post('/api/system/sync-plc-time', async (req, res) => {
  if (!s7 || appMode !== 'plc') return res.status(400).json({ error: 'Not connected to PLC' });
  try {
    const plcTimeStr = await s7.readPlcDateTime(120, 0);
    if (!plcTimeStr) return res.status(400).json({ error: 'Could not read valid DTL from DB120 offset 0.0' });
    
    const cmd = `timedatectl set-timezone Asia/Bangkok && date -s "${plcTimeStr}" && hwclock -w >/dev/null 2>&1 || true`;
    require('child_process').exec(cmd, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      console.log(`[TimeSync] 🕒 Manual Sync triggered: ${plcTimeStr}`);
      res.json({ success: true, syncedTime: plcTimeStr });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/system/time', (req, res) => {
  const { datetime } = req.body;
  if (!datetime) return res.status(400).json({ error: 'Datetime required' });
  const parts = datetime.split(' ');
  if (parts.length !== 2) return res.status(400).json({ error: 'Format must be DD/MM/YYYY HH:MM:SS' });
  const dateParts = parts[0].split('/');
  if (dateParts.length !== 3) return res.status(400).json({ error: 'Invalid date format' });
  
  const linuxDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${parts[1]}`;
  const cmd = `timedatectl set-ntp false && timedatectl set-timezone Asia/Bangkok && date -s "${linuxDate}" && hwclock -w`;
  
  require('child_process').exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error('Time set error:', err);
      return res.status(500).json({ error: 'Failed to set time. Must run as root.' });
    }
    res.json({ success: true });
  });
});

// ═══════════════════════════════════════════════
// Data Logging & USB APIs
// ═══════════════════════════════════════════════
app.get('/api/drives', (req, res) => {
  const drives = [];
  try {
    const os = require('os');
    if (os.platform() === 'win32') {
      const letters = 'CDEFGHIJKLMNOPQRSTUVWXYZ';
      for (let i = 0; i < letters.length; i++) {
        try { fs.accessSync(letters[i] + ':\\'); drives.push(letters[i] + ':\\'); } catch(e) {}
      }
    } else {
      ['/media', '/mnt', '/run/media'].forEach(base => {
        if (fs.existsSync(base)) {
          fs.readdirSync(base).forEach(item => {
            const full = path.join(base, item);
            try {
              if (fs.statSync(full).isDirectory()) {
                drives.push(full);
                if (base === '/media') {
                  fs.readdirSync(full).forEach(sub => {
                    const subFull = path.join(full, sub);
                    try { if (fs.statSync(subFull).isDirectory()) drives.push(subFull); } catch(e){}
                  });
                }
              }
            } catch (e) {}
          });
        }
      });
    }
  } catch (err) {}
  res.json({ drives });
});

app.post('/api/usb/mount', (req, res) => {
  const scriptPath = '/bin/bash /opt/pid-tuning-app/usb-mount-helper.sh';
  require('child_process').exec(scriptPath, (err, stdout, stderr) => {
    const out = stdout ? stdout.trim() : '';
    if (out.includes('SUCCESS')) {
      res.json({ success: true, message: 'USB Drive Mounted Successfully at /media/usb' });
    } else {
      const errMsg = out.replace(/^ERROR:\s*/, '') || (stderr ? stderr.trim() : 'Failed to mount USB.');
      res.status(500).json({ success: false, error: errMsg });
    }
  });
});

app.post('/api/usb/unmount', (req, res) => {
  const unmountScript = '/bin/bash /opt/pid-tuning-app/usb-unmount-helper.sh';
  require('child_process').exec(unmountScript, (err, stdout, stderr) => {
    res.json({ success: true, message: 'USB Ejected Safely' });
  });
});

// ── USB Save-All API (Mount → Copy All Logs → Generate HTML Viewer → Eject) ──
app.post('/api/usb/save-all', (req, res) => {
  const exec = require('child_process').exec;
  const USB_PATH = '/media/usb';
  const BACKUP_DIR = `${USB_PATH}/PID_Logs_Backup`;

  exec('/bin/bash /opt/pid-tuning-app/usb-mount-helper.sh', (mountErr, mountStdout, mountStderr) => {
    const out = mountStdout ? mountStdout.trim() : '';
    if (!out.includes('SUCCESS')) {
      const errMsg = out.replace(/^ERROR:\s*/, '') || (mountStderr ? mountStderr.trim() : 'USB Flash Drive not found.');
      return res.status(500).json({ success: false, error: errMsg });
    }

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
    const backupFolder = `${BACKUP_DIR}/${todayStr}`;

    exec(`mkdir -p "${backupFolder}"`, (err3) => {
      if (err3) return res.status(500).json({ success: false, error: 'Cannot create folder on USB: ' + err3.message });

      const allLogDirs = new Set([LOGS_DIR]);
      Object.values(blocks).forEach(b => {
        if (b.logPath && b.logPath.trim()) allLogDirs.add(b.logPath.trim());
      });

      const dirsArray = Array.from(allLogDirs);
      let totalCopied = 0;
      let copyErrors = [];
      let processed = 0;

      dirsArray.forEach(logDir => {
        try {
          if (!fs.existsSync(logDir)) { processed++; return; }
          const files = fs.readdirSync(logDir).filter(f => f.endsWith('.csv'));
          if (files.length === 0) { processed++; return; }

          let filesDone = 0;
          files.forEach(file => {
            const src = `"${logDir}/${file}"`;
            const dst = `"${backupFolder}/${file}"`;
            exec(`cp ${src} ${dst}`, (cpErr) => {
              if (!cpErr) totalCopied++;
              else copyErrors.push(file);
              filesDone++;
              if (filesDone === files.length) {
                processed++;
                if (processed === dirsArray.length) {
                  try {
                    const { generateHtmlViewer } = require('./generate-usb-viewer.js');
                    generateHtmlViewer(backupFolder);
                  } catch (e) {
                    if (typeof generateUsbHtmlViewer === 'function') generateUsbHtmlViewer(backupFolder);
                  }

                  exec('/bin/bash /opt/pid-tuning-app/usb-unmount-helper.sh', (ejErr) => {
                    const ejected = !ejErr;
                    res.json({
                      success: true,
                      copied: totalCopied,
                      errors: copyErrors,
                      ejected,
                      folder: backupFolder,
                      message: `Backup complete! ${totalCopied} file(s) copied. USB ejected. Safe to remove.`
                    });
                  });
                }
              }
            });
          });
        } catch (e) {
          processed++;
        }
      });

      if (dirsArray.length === 0) {
        exec('/bin/bash /opt/pid-tuning-app/usb-unmount-helper.sh', () => {});
        return res.json({ success: false, error: 'No log files found in the system.' });
      }
    });
  });
});

app.get('/api/logs/:id', (req, res) => {
  const b = blocks[req.params.id];
  if (!b) return res.status(404).json({ error: 'Block not found' });
  
  let targetDir = LOGS_DIR;
  if (b.logPath && b.logPath.trim() !== '') {
    targetDir = b.logPath.trim();
  }
  
  if (!fs.existsSync(targetDir)) {
    return res.json({ logs: [] });
  }
  
  const blockNameSafe = b.name.replace(/\W+/g, '_');
  const prefix = `log_${blockNameSafe}_`;
  
  fs.readdir(targetDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to read logs directory' });
    const logs = [];
    files.forEach(file => {
      if (file.startsWith(prefix) && file.endsWith('.csv')) {
        const filePath = path.join(targetDir, file);
        try {
          const stats = fs.statSync(filePath);
          logs.push({
            filename: file,
            size: stats.size,
            mtime: stats.mtimeMs,
            path: filePath
          });
        } catch (_) {}
      }
    });
    logs.sort((a, b) => b.mtime - a.mtime);
    res.json({ logs });
  });
});

app.get('/api/logs/download/:id', (req, res) => {
  const b = blocks[req.params.id];
  if (!b) return res.status(404).json({ error: 'Block not found' });
  
  const filename = req.query.file;
  if (!filename) return res.status(400).json({ error: 'File name required' });
  
  let targetDir = LOGS_DIR;
  if (b.logPath && b.logPath.trim() !== '') {
    targetDir = b.logPath.trim();
  }
  
  const filePath = path.join(targetDir, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.download(filePath, filename);
});

// ── Industrial Auto-Clear Logs Routine (Safe Retention) ──
function autoClearLogs() {
  console.log('[Auto-Clear] Checking log retention...');
  const now = Date.now();
  Object.values(blocks).forEach(b => {
    // Retain logs according to user setting (default 12 months = 365 days, minimum 90 days)
    const months = b.logAutoClearMonths || 12;
    const maxDays = Math.max(months * 30, 90);
    const maxAgeMs = maxDays * 24 * 60 * 60 * 1000;
    
    let targetDir = LOGS_DIR;
    if (b.logPath && b.logPath.trim() !== '') {
      targetDir = b.logPath.trim();
    }
    
    if (!fs.existsSync(targetDir)) return;
    
    const blockNameSafe = b.name.replace(/\W+/g, '_');
    const prefix = `log_${blockNameSafe}_`;
    
    fs.readdir(targetDir, (err, files) => {
      if (err) return;
      files.forEach(file => {
        if (file.startsWith(prefix) && file.endsWith('.csv')) {
          const filePath = path.join(targetDir, file);
          fs.stat(filePath, (err, stats) => {
            if (err) return;
            if (now - stats.mtimeMs > maxAgeMs) {
              fs.unlink(filePath, err => {
                if (!err) console.log(`[Auto-Clear] Removed expired log (> ${maxDays} days): ${filePath}`);
              });
            }
          });
        }
      });
    });
  });
}

// Run auto-clear on startup, then every 24 hours
setTimeout(autoClearLogs, 5000);
setInterval(autoClearLogs, 24 * 60 * 60 * 1000);

// ═══════════════════════════════════════════════
// ── Dev.Connection Wi-Fi Management APIs ──
// ═══════════════════════════════════════════════
app.get('/api/wifi/status', (req, res) => {
  const exec = require('child_process').exec;
  exec("nmcli -t -f NAME,TYPE,DEVICE con show --active", (err, stdout) => {
    let activeWifi = null;
    if (stdout) {
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        const parts = line.split(':');
        if (parts[1] && (parts[1].includes('wireless') || parts[1].includes('wifi') || parts[1].includes('802-11-wireless'))) {
          activeWifi = {
            ssid: parts[0],
            type: parts[1],
            device: parts[2] || 'wifi'
          };
          break;
        }
      }
    }
    
    if (activeWifi) {
      exec("nmcli -t -f IN-USE,SSID,SIGNAL dev wifi list", (err2, stdout2) => {
        let signal = 80;
        if (stdout2) {
          const wLines = stdout2.trim().split('\n');
          for (const wl of wLines) {
            const wp = wl.split(':');
            if (wp[0] === '*' || wp[1] === activeWifi.ssid) {
              signal = parseInt(wp[2], 10) || 80;
              break;
            }
          }
        }
        res.json({ connected: true, ssid: activeWifi.ssid, signal, device: activeWifi.device });
      });
    } else {
      res.json({ connected: false, ssid: null, signal: 0 });
    }
  });
});

app.get('/api/wifi/scan', (req, res) => {
  const exec = require('child_process').exec;
  exec("nmcli -t -f IN-USE,SSID,SIGNAL,SECURITY dev wifi list --rescan yes", { timeout: 15000 }, (err, stdout, stderr) => {
    const networks = [];
    const seen = new Set();
    if (stdout) {
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        if (!line) continue;
        const parts = line.split(':');
        if (parts.length >= 4) {
          const inUse = parts[0] === '*';
          const ssid = parts[1];
          const signal = parseInt(parts[2], 10) || 0;
          const security = parts[3] || 'OPEN';
          
          if (ssid && ssid.trim() !== '' && !seen.has(ssid)) {
            seen.add(ssid);
            networks.push({
              ssid: ssid.trim(),
              signal: isNaN(signal) ? 0 : signal,
              security: security.trim(),
              connected: inUse
            });
          }
        }
      }
    }
    networks.sort((a, b) => b.signal - a.signal);
    res.json({ networks });
  });
});

app.post('/api/wifi/connect', (req, res) => {
  const exec = require('child_process').exec;
  const { ssid, password } = req.body || {};
  if (!ssid) {
    return res.status(400).json({ error: 'SSID is required' });
  }

  const safeSsid = ssid.replace(/(["\\$`])/g, '\\$1');
  let cmd = `nmcli dev wifi connect "${safeSsid}"`;
  if (password && password.trim() !== '') {
    const safePass = password.replace(/(["\\$`])/g, '\\$1');
    cmd += ` password "${safePass}"`;
  }

  exec(cmd, { timeout: 30000 }, (err, stdout, stderr) => {
    const output = (stdout || '') + (stderr || '');
    if (err || output.toLowerCase().includes('error:')) {
      const errMsg = stderr ? stderr.trim() : (output.trim() || 'Failed to connect');
      return res.status(400).json({ success: false, error: errMsg });
    }
    res.json({ success: true, message: `Connected to ${ssid} successfully!` });
  });
});

app.post('/api/wifi/disconnect', (req, res) => {
  const exec = require('child_process').exec;
  exec("nmcli -t -f DEVICE,TYPE dev", (err, stdout) => {
    let wifiDev = '';
    if (stdout) {
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        const parts = line.split(':');
        if (parts[1] === 'wifi') {
          wifiDev = parts[0];
          break;
        }
      }
    }

    const cmd = wifiDev ? `nmcli dev disconnect ${wifiDev}` : `nmcli dev disconnect wlan0`;
    exec(cmd, (err2, stdout2, stderr2) => {
      res.json({ success: true, message: 'Wi-Fi Disconnected successfully' });
    });
  });
});

server.listen(PORT, () => {
  console.log(`\n  ╔══════════════════════════════════════╗`);
  console.log(`  ║   PID Tuning App  •  AMD64 IPC Ready   ║`);
  console.log(`  ╠══════════════════════════════════════╣`);
  console.log(`  ║  http://localhost:${PORT}               ║`);
  console.log(`  ╚══════════════════════════════════════╝\n`);
});
