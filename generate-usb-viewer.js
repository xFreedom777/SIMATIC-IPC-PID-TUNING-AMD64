const fs = require('fs');
const path = require('path');

const EMBEDDED_LOGO_B64 = "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";

function generateHtmlViewer(backupFolder) {
  if (!backupFolder || !fs.existsSync(backupFolder)) {
    console.error('Directory does not exist:', backupFolder);
    return false;
  }

  const files = fs.readdirSync(backupFolder).filter(f => f.endsWith('.csv'));
  if (files.length === 0) {
    console.log('No CSV files found in:', backupFolder);
    return false;
  }

  // Structure: allData[loopName][date] = { filename, date, count, rows }
  const allData = {};

  files.forEach(f => {
    try {
      const content = fs.readFileSync(path.join(backupFolder, f), 'utf8');
      const lines = content.split('\n').filter(l => l.trim().length > 0);
      if (lines.length < 2) return;

      const dateMatch = f.match(/(\d{4}-\d{2}-\d{2})\.csv$/);
      const dateStr = dateMatch ? dateMatch[1] : 'Unknown Date';

      let loopName = f.replace(/^log_/, '').replace(/_\d{4}-\d{2}-\d{2}\.csv$/, '');
      loopName = loopName.replace(/_/g, ' ').trim();
      if (!loopName) loopName = 'Default Loop';

      if (!allData[loopName]) {
        allData[loopName] = {};
      }

      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length >= 4) {
          let cleanTime = parts[0] ? parts[0].trim() : '';
          // Clean up ISO timestamps: '2026-07-30T12:30:15.405Z' -> '2026-07-30 12:30:15'
          if (cleanTime.includes('T')) cleanTime = cleanTime.replace('T', ' ');
          if (cleanTime.includes('.')) cleanTime = cleanTime.split('.')[0];
          cleanTime = cleanTime.replace(/Z$/i, '').trim();

          rows.push({
            time: cleanTime,
            sp: parseFloat(parts[1]) || 0,
            pv: parseFloat(parts[2]) || 0,
            out: parseFloat(parts[3]) || 0,
            mode: parts[4] ? parts[4].trim() : '',
            state: parts[5] ? parts[5].trim() : ''
          });
        }
      }

      allData[loopName][dateStr] = {
        filename: f,
        date: dateStr,
        count: rows.length,
        rows: rows
      };
    } catch (err) {
      console.error('Error parsing file:', f, err);
    }
  });

  const jsonData = JSON.stringify(allData);

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PID Industrial Daily Log Viewer - Mitr Phol</title>
  <style>
    :root {
      --bg: #0b0f19;
      --card: #111827;
      --card-alt: #1e293b;
      --border: #334155;
      --cyan: #38bdf8;
      --green: #10b981;
      --orange: #f59e0b;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 24px; }
    
    /* Header Bar */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 18px;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .brand-group {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .header-logo {
      height: 48px;
      width: auto;
      border-radius: 6px;
      background: #ffffff;
      padding: 3px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    }
    .header-titles {
      display: flex;
      flex-direction: column;
    }
    .title {
      font-size: 20px;
      font-weight: 800;
      color: var(--cyan);
      letter-spacing: 0.5px;
    }
    .sub {
      font-size: 12.5px;
      color: var(--text-muted);
      margin-top: 3px;
      font-weight: 500;
    }
    
    /* Controls Bar */
    .controls {
      display: flex;
      gap: 20px;
      align-items: flex-end;
      flex-wrap: wrap;
      margin-bottom: 22px;
      background: #1e293b;
      padding: 16px 20px;
      border-radius: 8px;
      border: 1px solid var(--border);
    }
    .control-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .control-label {
      font-size: 11.5px;
      font-weight: 700;
      color: var(--cyan);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    select, button {
      background: #0f172a;
      border: 1.5px solid #475569;
      color: #f8fafc;
      padding: 9px 16px;
      border-radius: 6px;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      outline: none;
      transition: 0.2s;
      min-width: 200px;
    }
    select:hover, select:focus {
      border-color: var(--cyan);
      box-shadow: 0 0 8px rgba(56, 189, 248, 0.25);
    }
    .btn-print {
      background: linear-gradient(135deg, #0284c7, #0369a1);
      border: 1px solid #38bdf8;
      min-width: auto;
      padding: 9px 20px;
    }
    .btn-print:hover {
      background: linear-gradient(135deg, #0369a1, #075985);
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.35);
    }
    
    /* KPI Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
      margin-bottom: 22px;
    }
    .stat-box {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px 18px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    }
    .stat-label {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .stat-val {
      font-size: 22px;
      font-weight: 800;
      color: #fff;
      margin-top: 6px;
    }
    
    /* Cards */
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 22px;
      box-shadow: 0 6px 25px rgba(0,0,0,0.4);
    }
    .card-title {
      font-size: 13.5px;
      font-weight: 800;
      color: var(--cyan);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    
    /* Chart */
    #chartContainer {
      position: relative;
      width: 100%;
      height: 430px;
      background: #070b14;
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }
    #chartCanvas {
      width: 100%;
      height: 100%;
      display: block;
    }
    #tooltip {
      position: absolute;
      display: none;
      background: rgba(15, 23, 42, 0.96);
      border: 1.5px solid var(--cyan);
      border-radius: 6px;
      padding: 10px 14px;
      font-size: 12px;
      pointer-events: none;
      box-shadow: 0 4px 15px rgba(0,0,0,0.8);
      z-index: 100;
      min-width: 170px;
    }
    
    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      background: #1e293b;
      color: var(--cyan);
      text-align: left;
      padding: 11px 14px;
      border-bottom: 2px solid var(--border);
      font-weight: 700;
      position: sticky;
      top: 0;
    }
    td {
      padding: 9px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      color: #cbd5e1;
    }
    tr:nth-child(even) {
      background: rgba(255,255,255,0.02);
    }
    tr:hover {
      background: rgba(56,189,248,0.06);
    }
    .table-container {
      max-height: 380px;
      overflow-y: auto;
      border: 1px solid var(--border);
      border-radius: 8px;
    }
    
    @media print {
      body { background: #fff; color: #000; padding: 0; }
      .header, .controls, .table-container, .btn-print { border-color: #000; }
      #chartContainer { border: 1px solid #000; background: #fff; }
      .header-logo { box-shadow: none; border: 1px solid #ccc; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand-group">
      <img src="data:image/png;base64,${EMBEDDED_LOGO_B64}" class="header-logo" alt="Mitr Phol Logo" />
      <div class="header-titles">
        <div class="title">INDUSTRIAL PID LOGGING VIEWER</div>
        <div class="sub">MITR PHOL PIN MILL PLANT — Process Trend & Historical Data Analysis</div>
      </div>
    </div>
    <div class="header-actions">
      <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
    </div>
  </div>

  <div class="controls">
    <div class="control-group">
      <label class="control-label" for="loopSelect">1. SELECT PID LOOP:</label>
      <select id="loopSelect" onchange="onLoopChange()"></select>
    </div>

    <div class="control-group">
      <label class="control-label" for="dateSelect">2. SELECT LOG DATE / FILE:</label>
      <select id="dateSelect" onchange="renderSelectedData()"></select>
    </div>

    <div id="fileInfo" style="font-size:12.5px; color:var(--text-muted); margin-left: auto;"></div>
  </div>

  <div class="stats-grid" id="statsGrid"></div>

  <div class="card">
    <div class="card-title">
      <span>📈 High-Resolution Trend Graph (SP / PV / Output)</span>
      <span style="font-size:12px; color:var(--text-muted); text-transform:none; font-weight:500;">Hover mouse across graph to inspect exact values</span>
    </div>
    <div id="chartContainer">
      <canvas id="chartCanvas"></canvas>
      <div id="tooltip"></div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">📋 Historical Log Samples</div>
    <div class="table-container">
      <table id="dataTable">
        <thead><tr><th>Timestamp</th><th>Setpoint (SP)</th><th>Process Value (PV)</th><th>Output (%)</th><th>Mode</th><th>State</th></tr></thead>
        <tbody id="tableBody"></tbody>
      </table>
    </div>
  </div>

  <script>
    const DATA = ${jsonData};
    const loops = Object.keys(DATA);

    const loopSel = document.getElementById('loopSelect');
    const dateSel = document.getElementById('dateSelect');

    // Populate Loop Dropdown
    loops.forEach(k => {
      const opt = document.createElement('option');
      opt.value = k;
      const dateCount = Object.keys(DATA[k]).length;
      opt.textContent = k + ' (' + dateCount + ' log' + (dateCount > 1 ? 's' : '') + ')';
      loopSel.appendChild(opt);
    });

    function onLoopChange() {
      const loop = loopSel.value;
      if (!DATA[loop]) return;

      dateSel.innerHTML = '';
      const dates = Object.keys(DATA[loop]).sort().reverse(); // Newest first

      dates.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        const rec = DATA[loop][d];
        opt.textContent = d + ' (' + rec.count + ' pts) - ' + rec.filename;
        dateSel.appendChild(opt);
      });

      renderSelectedData();
    }

    let currentRows = [];

    function renderSelectedData() {
      const loop = loopSel.value;
      const date = dateSel.value;

      if (!DATA[loop] || !DATA[loop][date]) return;
      const rec = DATA[loop][date];
      document.getElementById('fileInfo').innerHTML = '<b>File:</b> ' + rec.filename + ' | <b>Date:</b> ' + rec.date + ' | <b>Total:</b> ' + rec.count + ' pts';

      currentRows = rec.rows;
      if (currentRows.length === 0) return;

      // Calculate Statistics
      let maxPV = -Infinity, minPV = Infinity, sumPV = 0, sumErr = 0;
      currentRows.forEach(r => {
        if (r.pv > maxPV) maxPV = r.pv;
        if (r.pv < minPV) minPV = r.pv;
        sumPV += r.pv;
        sumErr += Math.abs(r.sp - r.pv);
      });
      const avgPV = (sumPV / currentRows.length).toFixed(2);
      const avgErr = (sumErr / currentRows.length).toFixed(2);

      document.getElementById('statsGrid').innerHTML = \`
        <div class="stat-box"><div class="stat-label">Total Log Points</div><div class="stat-val">\${currentRows.length}</div></div>
        <div class="stat-box"><div class="stat-label">Max Process Value</div><div class="stat-val" style="color:var(--green)">\${maxPV.toFixed(2)}</div></div>
        <div class="stat-box"><div class="stat-label">Min Process Value</div><div class="stat-val" style="color:var(--cyan)">\${minPV.toFixed(2)}</div></div>
        <div class="stat-box"><div class="stat-label">Average PV</div><div class="stat-val">\${avgPV}</div></div>
        <div class="stat-box"><div class="stat-label">Average SP Error</div><div class="stat-val" style="color:var(--orange)">\${avgErr}</div></div>
      \`;

      // Table View (sampled max 500 rows for smooth DOM performance)
      const tb = document.getElementById('tableBody');
      tb.innerHTML = '';
      const step = Math.max(1, Math.floor(currentRows.length / 500));
      for (let i = 0; i < currentRows.length; i += step) {
        const r = currentRows[i];
        const tr = document.createElement('tr');
        tr.innerHTML = \`
          <td>\${r.time}</td>
          <td style="color:var(--cyan); font-weight:700">\${r.sp.toFixed(2)}</td>
          <td style="color:var(--green); font-weight:700">\${r.pv.toFixed(2)}</td>
          <td style="color:var(--orange); font-weight:700">\${r.out.toFixed(2)}%</td>
          <td>\${r.mode}</td>
          <td>\${r.state}</td>
        \`;
        tb.appendChild(tr);
      }

      drawChart(currentRows);
    }

    let chartBounds = null;

    function drawChart(rows, hoverIdx = -1) {
      const container = document.getElementById('chartContainer');
      const cvs = document.getElementById('chartCanvas');
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      cvs.width = rect.width * dpr;
      cvs.height = rect.height * dpr;
      const ctx = cvs.getContext('2d');
      const W = cvs.width, H = cvs.height;

      // Clean Dark Slate Background
      ctx.fillStyle = '#070b14';
      ctx.fillRect(0, 0, W, H);

      const padL = 75 * dpr, padR = 75 * dpr, padT = 45 * dpr, padB = 45 * dpr;
      const plotW = W - padL - padR;
      const plotH = H - padT - padB;

      // Standard Range for SP and PV (-0.1 to 200, step 10)
      const minVal = -0.1;
      const maxVal = 200;

      chartBounds = { padL, padR, padT, padB, plotW, plotH, minVal, maxVal, dpr };

      // Grid Lines & Axis Ticks (Step 10)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1 * dpr;

      const numSteps = 20; // 0, 10, 20, 30 ... 200 (step 10)
      for (let i = 0; i <= numSteps; i++) {
        const vLeft = 200 - i * 10;
        const y = padT + (plotH / (maxVal - minVal)) * (maxVal - vLeft);

        ctx.beginPath(); 
        ctx.moveTo(padL, y); 
        ctx.lineTo(W - padR, y); 
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.font = \`bold \${11 * dpr}px sans-serif\`;
        ctx.textAlign = 'right';
        ctx.fillText(vLeft.toFixed(0), padL - 10 * dpr, y + 4 * dpr);

        // Right axis Output (%)
        if (i % 2 === 0) {
          const vRight = (100 - (i / numSteps) * 100).toFixed(0) + '%';
          ctx.fillStyle = '#f59e0b';
          ctx.textAlign = 'left';
          ctx.fillText(vRight, W - padR + 10 * dpr, y + 4 * dpr);
        }
      }

      // Bottom label -0.1
      const yBottom = padT + plotH;
      ctx.fillStyle = '#10b981';
      ctx.font = \`bold \${10 * dpr}px sans-serif\`;
      ctx.textAlign = 'right';
      ctx.fillText('-0.1', padL - 10 * dpr, yBottom + 4 * dpr);

      // X Axis Time Labels
      ctx.fillStyle = '#94a3b8';
      ctx.font = \`\${11 * dpr}px sans-serif\`;
      ctx.textAlign = 'center';
      const xCount = 8;
      for (let i = 0; i <= xCount; i++) {
        const idx = Math.min(rows.length - 1, Math.floor((rows.length / xCount) * i));
        const x = padL + (plotW / xCount) * i;
        const timeStr = rows[idx].time.length > 11 ? rows[idx].time.substring(11, 16) : rows[idx].time;
        ctx.fillText(timeStr, x, H - 15 * dpr);
      }

      // Plot Output (%)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5 * dpr;
      ctx.beginPath();
      rows.forEach((r, idx) => {
        const x = padL + (idx / (rows.length - 1)) * plotW;
        const y = padT + plotH - (r.out / 100) * plotH;
        if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Plot Setpoint (SP)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3 * dpr;
      ctx.setLineDash([8 * dpr, 4 * dpr]);
      ctx.beginPath();
      rows.forEach((r, idx) => {
        const x = padL + (idx / (rows.length - 1)) * plotW;
        const y = padT + plotH - ((r.sp - minVal) / (maxVal - minVal)) * plotH;
        if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Plot Process Value (PV)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3.5 * dpr;
      ctx.beginPath();
      rows.forEach((r, idx) => {
        const x = padL + (idx / (rows.length - 1)) * plotW;
        const y = padT + plotH - ((r.pv - minVal) / (maxVal - minVal)) * plotH;
        if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Draw Hover Indicator & Points
      if (hoverIdx >= 0 && hoverIdx < rows.length) {
        const r = rows[hoverIdx];
        const x = padL + (hoverIdx / (rows.length - 1)) * plotW;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5 * dpr;
        ctx.setLineDash([4 * dpr, 4 * dpr]);
        ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
        ctx.setLineDash([]);

        const ySP = padT + plotH - ((r.sp - minVal) / (maxVal - minVal)) * plotH;
        const yPV = padT + plotH - ((r.pv - minVal) / (maxVal - minVal)) * plotH;
        const yOut = padT + plotH - (r.out / 100) * plotH;

        [ {y: ySP, c: '#38bdf8'}, {y: yPV, c: '#10b981'}, {y: yOut, c: '#f59e0b'} ].forEach(pt => {
          ctx.fillStyle = pt.c;
          ctx.beginPath(); ctx.arc(x, pt.y, 5 * dpr, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2 * dpr; ctx.stroke();
        });
      }

      // Legend Header
      ctx.font = \`bold \${13 * dpr}px sans-serif\`;
      ctx.fillStyle = '#38bdf8'; ctx.fillText('-- SP (Setpoint)', padL + 20 * dpr, 24 * dpr);
      ctx.fillStyle = '#10b981'; ctx.fillText('— PV (Process Value)', padL + 180 * dpr, 24 * dpr);
      ctx.fillStyle = '#f59e0b'; ctx.fillText('— Output (%)', padL + 370 * dpr, 24 * dpr);
    }

    // Tooltip Mouse Event Listeners
    const container = document.getElementById('chartContainer');
    const tooltip = document.getElementById('tooltip');

    container.addEventListener('mousemove', (e) => {
      if (!currentRows.length || !chartBounds) return;
      const rect = container.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * chartBounds.dpr;
      const { padL, plotW } = chartBounds;

      if (mouseX < padL || mouseX > padL + plotW) {
        tooltip.style.display = 'none';
        drawChart(currentRows, -1);
        return;
      }

      const ratio = (mouseX - padL) / plotW;
      const idx = Math.min(currentRows.length - 1, Math.max(0, Math.round(ratio * (currentRows.length - 1))));
      const r = currentRows[idx];

      drawChart(currentRows, idx);

      tooltip.style.display = 'block';
      let posX = e.clientX - rect.left + 15;
      if (posX + 180 > rect.width) posX = e.clientX - rect.left - 190;
      tooltip.style.left = posX + 'px';
      tooltip.style.top = Math.max(10, e.clientY - rect.top - 50) + 'px';

      tooltip.innerHTML = \`
        <div style="color:#94a3b8; font-weight:700; margin-bottom:6px; border-bottom:1px solid #334155; padding-bottom:4px;">⏱️ \${r.time}</div>
        <div style="color:var(--cyan); font-weight:700; margin-bottom:3px;">SP: \${r.sp.toFixed(2)}</div>
        <div style="color:var(--green); font-weight:700; margin-bottom:3px;">PV: \${r.pv.toFixed(2)}</div>
        <div style="color:var(--orange); font-weight:700;">Output: \${r.out.toFixed(2)}%</div>
      \`;
    });

    container.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
      if (currentRows.length) drawChart(currentRows, -1);
    });

    window.addEventListener('resize', () => {
      if (currentRows.length) drawChart(currentRows, -1);
    });

    if (loops.length > 0) onLoopChange();
  </script>
</body>
</html>`;

  const outputPath = path.join(backupFolder, 'Click_To_View_Chart.html');
  fs.writeFileSync(outputPath, htmlContent, 'utf8');
  console.log('✅ Generated Corporate Engineering HTML Viewer with Logo:', outputPath);
  return true;
}

// Support CLI execution: node generate-usb-viewer.js <target_folder>
if (require.main === module) {
  const targetDir = process.argv[2] || path.join(__dirname, 'logs');
  generateHtmlViewer(targetDir);
}

module.exports = { generateHtmlViewer };
