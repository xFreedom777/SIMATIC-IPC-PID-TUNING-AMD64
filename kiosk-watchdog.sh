#!/bin/bash
# ================================================================
# MITRPHOL AMD64 IPC (Dell OptiPlex 3000) - 24/7 Watchdog Daemon
# ================================================================

LOG_FILE="/var/log/kiosk-watchdog.log"
exec >> "$LOG_FILE" 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🛡 Watchdog Daemon Started (Dell OptiPlex 3000 / AMD64)"

# Wait for initial boot to settle before enforcing health checks
sleep 15

while true; do
  # 1. Check Node.js Backend Health
  # Max time 5s prevents watchdog hanging if Node.js server is blocked
  HTTP_CODE=$(curl -s --max-time 5 -o /dev/null -w "%{http_code}" http://localhost:3000/api/status 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" != "200" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ Node Backend unreachable (HTTP $HTTP_CODE). Restarting pid-app.service..."
    systemctl restart pid-app.service || true
    sleep 5
  fi

  # 2. Check Kiosk Display Service Status
  # Note: kiosk.service has its own systemd Restart=always handler.
  # We only intervene if the service is completely dead/inactive.
  if ! systemctl is-active --quiet kiosk.service; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ Kiosk service is inactive. Starting kiosk.service..."
    systemctl start kiosk.service || true
    sleep 5
  fi

  # 3. Prevent Display Sleep & Screen Blanking (Keep DPMS active 24/7)
  export DISPLAY=:0
  xset -dpms 2>/dev/null || true
  xset s off 2>/dev/null || true
  xset s noblank 2>/dev/null || true
  xset dpms force on 2>/dev/null || true

  # 4. Check RAM Pressure (OptiPlex 3000 has 8GB-16GB RAM)
  FREE_RAM_MB=$(free -m | awk '/^Mem:/{print $7}')
  if [ -n "$FREE_RAM_MB" ] && [ "$FREE_RAM_MB" -lt 300 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ Low RAM detected (${FREE_RAM_MB}MB free). Clearing PageCaches..."
    sync && echo 3 > /proc/sys/vm/drop_caches || true
  fi

  # 5. Continuous Offline Time Persistence
  CURRENT_YEAR=$(date '+%Y')
  if [ "$CURRENT_YEAR" -ge 2024 ]; then
    date '+%Y-%m-%d %H:%M:%S' > /etc/last_saved_time 2>/dev/null || true
  fi

  sleep 20
done