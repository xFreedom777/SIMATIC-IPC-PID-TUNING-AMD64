#!/bin/bash
# ================================================================
# Lenovo ThinkCentre AMD64 - Self-Healing Watchdog Daemon
# ================================================================

LOG_FILE="/var/log/kiosk-watchdog.log"
exec >> "$LOG_FILE" 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🛡 Watchdog Daemon Started (AMD64 IPC)"

while true; do
  # 1. Check Node Backend Health
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/status || echo "000")
  if [ "$HTTP_CODE" != "200" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ Node Backend unreachable (HTTP $HTTP_CODE). Restarting pid-app service..."
    systemctl restart pid-app.service || true
    sleep 5
  fi

  # 2. Check Chromium Display Process
  if ! pgrep -x "chromium" > /dev/null && ! pgrep -f "chromium" > /dev/null; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ Chromium Kiosk process dead. Restarting kiosk service..."
    systemctl restart kiosk.service || true
    sleep 5
  fi

  # 3. Check System RAM Pressure (Lenovo PC has 8-16GB RAM)
  FREE_RAM_MB=$(free -m | awk '/^Mem:/{print $7}')
  if [ -n "$FREE_RAM_MB" ] && [ "$FREE_RAM_MB" -lt 300 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ Low RAM detected (${FREE_RAM_MB}MB free). Clearing PageCaches..."
    sync && echo 3 > /proc/sys/vm/drop_caches || true
  fi

  # 4. Off-Peak Soft Refresh (Every day at 03:00 AM)
  CURRENT_TIME=$(date '+%H:%M')
  if [ "$CURRENT_TIME" == "03:00" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🌙 Daily Maintenance: Soft-restarting Kiosk Display..."
    pkill -f "chromium" || true
    sleep 2
    systemctl restart kiosk.service || true
    sleep 60
  fi

  # 5. Continuous Time Persistence
  CURRENT_YEAR=$(date '+%Y')
  if [ "$CURRENT_YEAR" -ge 2024 ]; then
    date '+%Y-%m-%d %H:%M:%S' > /etc/last_saved_time 2>/dev/null || true
  fi

  sleep 20
done
