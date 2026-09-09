#!/bin/bash
# ================================================================
# Siemens SIMATIC IOT2050 — 24/7 Industrial Stability & Power-Cut Proof Setup
# Developed by Dream Piyapong (xFreedom777)
# ================================================================
set -e

echo "==========================================================="
echo " 🛠  Configuring Siemens IOT2050 24/7 Stability & Protection"
echo "==========================================================="

if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root (sudo ./setup-247-stability.sh)"
  exit 1
fi

APP_DIR="/opt/pid-tuning-app"
USER_HOME="/root"

# 1. Disable System Idle & Lid Sleep Actions in logind.conf
echo "--> [1/10] Disabling logind sleep & idle actions..."
mkdir -p /etc/systemd/logind.conf.d/
cat << 'EOF' > /etc/systemd/logind.conf.d/247-stability.conf
[Login]
IdleAction=ignore
HandleLidSwitch=ignore
HandleSuspendKey=ignore
HandleHibernateKey=ignore
HandlePowerKey=ignore
EOF
systemctl restart systemd-logind || true

# 2. Disable Kernel Console Blanking
echo "--> [2/10] Disabling Linux kernel console blanking..."
if [ -f /sys/module/kernel/parameters/consoleblank ]; then
  echo 0 > /sys/module/kernel/parameters/consoleblank 2>/dev/null || true
fi
if grep -q "consoleblank" /etc/sysctl.conf; then
  sed -i 's/consoleblank=.*/consoleblank=0/' /etc/sysctl.conf
else
  echo "kernel.consoleblank = 0" >> /etc/sysctl.conf
fi

# 3. Limit Systemd Journal Logs to 50MB (Prevents RAM/Disk Exhaustion)
echo "--> [3/10] Configuring Journald log limits (Max 50MB in RAM)..."
mkdir -p /etc/systemd/journald.conf.d/
cat << 'EOF' > /etc/systemd/journald.conf.d/limit-size.conf
[Journal]
Storage=volatile
SystemMaxUse=50M
SystemKeepFree=100M
MaxRetentionSec=1month
EOF
systemctl restart systemd-journald || true

# 4. Generate Production ~/.xinitrc with GPU-disabled & DPMS-off flags
echo "--> [4/10] Installing X11 Kiosk launcher (~/.xinitrc)..."
cat << 'EOF' > "${USER_HOME}/.xinitrc"
#!/bin/bash
# ── Siemens IOT2050 24/7 Kiosk Launcher ──

# Disable Display Power Management (DPMS) & Screen Savers
xset -dpms
xset s off
xset s noblank
xset s 0 0
setterm -blank 0 -powerdown 0 2>/dev/null || true

# Fix mouse cursor styling
xsetroot -cursor_name left_ptr &

# Clear previous Chromium crash locks & restore profiles
rm -rf ~/.config/chromium/Singleton*
rm -rf ~/.config/chromium/Default/WebData*
find ~/.config/chromium -name "Preferences" -exec sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' {} + 2>/dev/null || true
find ~/.config/chromium -name "Preferences" -exec sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' {} + 2>/dev/null || true

# Continuous Kiosk Loop with GPU-disabled flags (prevents ARM driver freeze)
while true; do
  chromium \
    --no-sandbox \
    --disable-dev-shm-usage \
    --no-first-run \
    --password-store=basic \
    --kiosk \
    --start-fullscreen \
    --start-maximized \
    --window-size=1920,1080 \
    --window-position=0,0 \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --disable-gpu \
    --disable-software-rasterizer \
    --disk-cache-size=1 \
    --media-cache-size=1 \
    --js-flags="--max-old-space-size=256" \
    --autoplay-policy=no-user-gesture-required \
    --force-device-scale-factor=1.0 \
    http://localhost:3000/splash.html
  
  sleep 2
done
EOF
chmod +x "${USER_HOME}/.xinitrc"

# 5. RAM Tmpfs Protection & Ext4 Filesystem Hardening
echo "--> [5/10] Configuring /etc/fstab for Tmpfs and Ext4 Auto-Repair policies..."
# Revert dangerous 'errors=continue' and ensure safe 'errors=remount-ro'
sed -i 's/errors=continue/errors=remount-ro/g' /etc/fstab

if ! grep -q "tmpfs /var/log" /etc/fstab; then
  echo "tmpfs /var/log tmpfs defaults,noatime,nosuid,mode=0755,size=50m 0 0" >> /etc/fstab
fi
if ! grep -q "tmpfs /tmp" /etc/fstab; then
  echo "tmpfs /tmp tmpfs defaults,noatime,nosuid,size=50m 0 0" >> /etc/fstab
fi
if ! grep -q "tmpfs /var/tmp" /etc/fstab; then
  echo "tmpfs /var/tmp tmpfs defaults,noatime,nosuid,size=30m 0 0" >> /etc/fstab
fi

# Configure Kernel Bootargs Auto-Repair (fsck.repair=yes)
echo "--> [6/10] Enabling Boot-Time Auto-FSCK Disk Repair..."
if [ -f /etc/default/rcS ]; then
  sed -i 's/FSCKFIX=.*/FSCKFIX=yes/' /etc/default/rcS || echo "FSCKFIX=yes" >> /etc/default/rcS
fi

# Check and update U-Boot bootargs if uEnv.txt exists
for uenv in /boot/uEnv.txt /boot/efi/uEnv.txt /uEnv.txt; do
  if [ -f "$uenv" ]; then
    if ! grep -q "fsck.repair=yes" "$uenv"; then
      echo "extra_bootargs=fsck.mode=force fsck.repair=yes" >> "$uenv"
      echo "    [OK] Added fsck.repair=yes to $uenv"
    fi
  fi
done

# 7. Power-Cut Proof: Install & Configure Overlayroot (Read-Only Root Filesystem - Offline Mode)
echo "--> [7/10] Setting up Power-Cut Protection (OverlayFS / Read-Only Root)..."
if ! dpkg -l | grep -q "overlayroot"; then
  echo "    Installing offline overlayroot.deb package..."
  if [ -f "${APP_DIR}/overlayroot.deb" ]; then
    dpkg -i "${APP_DIR}/overlayroot.deb" 2>/dev/null || true
  fi
fi

# Enable OverlayFS on tmpfs (RAM)
mkdir -p /etc
cat << 'EOF' > /etc/overlayroot.conf
overlayroot="tmpfs:swap=0,recurse=0"
EOF

cat << 'EOF' > /etc/overlayroot.local.conf
overlayroot="tmpfs:swap=0,recurse=0"
EOF

# Update initramfs image to include overlayroot boot hooks
echo "    Updating initramfs kernel image (this may take 10-15s)..."
update-initramfs -u 2>/dev/null || true

# 8. Install Watchdog script
echo "--> [8/10] Installing Self-Healing Watchdog script..."
chmod +x "${APP_DIR}/kiosk-watchdog.sh" 2>/dev/null || true

# 9. Install & Enable Standard Systemd Services
echo "--> [9/10] Registering production Systemd services..."
cp "${APP_DIR}/pid-app.service" /etc/systemd/system/ 2>/dev/null || true
cp "${APP_DIR}/kiosk-watchdog.service" /etc/systemd/system/ 2>/dev/null || true
cp "${APP_DIR}/kiosk.service" /etc/systemd/system/ 2>/dev/null || true

systemctl daemon-reload
systemctl enable pid-app.service || true
systemctl enable kiosk-watchdog.service || true
systemctl enable kiosk.service || true

# 10. Offline Industrial Time Persistence & Midnight USB Auto-Backup
echo "--> [10/10] Configuring offline time persistence & USB Backup..."
# Boot restore service
cat << 'EOF' > /etc/systemd/system/save-last-time.service
[Unit]
Description=Restore System Time from Last Saved Timestamp (Offline NTP)
DefaultDependencies=no
After=local-fs.target
Before=network.target sysinit.target

[Service]
Type=oneshot
RemainAfterExit=no
ExecStart=/bin/sh -c 'if [ -f /etc/last_saved_time ]; then ts=$(cat /etc/last_saved_time); date -s "$ts" >/dev/null 2>&1 && hwclock -w >/dev/null 2>&1 && echo "[OK] System time restored from $ts" || true; fi'

[Install]
WantedBy=sysinit.target
EOF

# Shutdown save service
cat << 'EOF' > /etc/systemd/system/save-time-on-shutdown.service
[Unit]
Description=Save System Time Before Shutdown (Offline NTP Backup)
DefaultDependencies=no
Before=shutdown.target reboot.target halt.target poweroff.target
After=basic.target

[Service]
Type=oneshot
RemainAfterExit=no
ExecStart=/bin/sh -c 'if [ "$(date +%Y)" -ge "2024" ]; then date "+%Y-%m-%d %H:%M:%S" > /etc/last_saved_time && hwclock -w >/dev/null 2>&1 && echo "[OK] System time saved: $(cat /etc/last_saved_time)" || true; fi'

[Install]
WantedBy=halt.target reboot.target shutdown.target poweroff.target
EOF

# Midnight USB Backup
cat << 'CRONEOF' > /usr/local/bin/pid-usb-backup.sh
#!/bin/bash
# Midnight Auto-Backup: Copy all PID Log CSV files to USB Flash Drive
LOG=/var/log/pid-usb-backup.log
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🕛 Auto-Backup Started" >> "$LOG"

/bin/bash /opt/pid-tuning-app/usb-mount-helper.sh >> "$LOG" 2>&1 || true

if ! mount | grep -q /media/usb; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ USB not available. Skipping backup." >> "$LOG"
  exit 0
fi

TODAY=$(date '+%Y-%m-%d')
DEST="/media/usb/PID_Logs_Backup/${TODAY}"
mkdir -p "$DEST"

SRC="/opt/pid-tuning-app/logs"
if [ -d "$SRC" ]; then
  COUNT=$(find "$SRC" -name "*.csv" | wc -l)
  cp -u "$SRC"/*.csv "$DEST"/ 2>/dev/null || true
  node /opt/pid-tuning-app/generate-usb-viewer.js "$DEST" 2>/dev/null || true
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Copied ${COUNT} files ➔ $DEST" >> "$LOG"
fi

sync
/bin/bash /opt/pid-tuning-app/usb-unmount-helper.sh >> "$LOG" 2>&1 || umount /media/usb 2>/dev/null || true
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 💾 Auto-Backup Done. USB Ejected." >> "$LOG"

tail -n 500 "$LOG" > "${LOG}.tmp" && mv "${LOG}.tmp" "$LOG"
CRONEOF' > /usr/local/bin/pid-usb-backup.sh
#!/bin/bash
# Midnight Auto-Backup: Copy all PID Log CSV files to USB Flash Drive
LOG=/var/log/pid-usb-backup.log
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🕛 Auto-Backup Started" >> "$LOG"

mount /dev/sda1 /media/usb 2>/dev/null || true

if ! mount | grep -q /media/usb; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ USB not available. Skipping backup." >> "$LOG"
  exit 0
fi

TODAY=$(date '+%Y-%m-%d')
DEST="/media/usb/PID_Logs_Backup/${TODAY}"
mkdir -p "$DEST"

SRC="/opt/pid-tuning-app/logs"
if [ -d "$SRC" ]; then
  COUNT=$(find "$SRC" -name "*.csv" | wc -l)
  cp -u "$SRC"/*.csv "$DEST"/ 2>/dev/null || true
  node /opt/pid-tuning-app/generate-usb-viewer.js "$DEST" 2>/dev/null || true
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Copied ${COUNT} files ➔ $DEST" >> "$LOG"
fi

sync
umount /media/usb 2>/dev/null || true
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 💾 Auto-Backup Done. USB Ejected." >> "$LOG"

tail -n 500 "$LOG" > "${LOG}.tmp" && mv "${LOG}.tmp" "$LOG"
CRONEOF
chmod +x /usr/local/bin/pid-usb-backup.sh

cat << 'TIMEREOF' > /etc/systemd/system/pid-usb-backup.timer
[Unit]
Description=Midnight USB Log Auto-Backup Timer
Requires=pid-usb-backup.service

[Timer]
OnCalendar=*-*-* 00:01:00
Persistent=true

[Install]
WantedBy=timers.target
TIMEREOF

cat << 'SVCEOF' > /etc/systemd/system/pid-usb-backup.service
[Unit]
Description=PID USB Log Auto-Backup
After=local-fs.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/pid-usb-backup.sh
StandardOutput=journal
StandardError=journal
SVCEOF

systemctl daemon-reload
systemctl enable save-last-time.service || true
systemctl enable save-time-on-shutdown.service || true
systemctl enable pid-usb-backup.timer || true
systemctl start save-last-time.service || true
systemctl start pid-usb-backup.timer || true

echo "==========================================================="
echo " 🎉 24/7 Stability & Power-Cut Protection Ready!"
echo " [INFO] SD Card is protected by OverlayFS Read-Only."
echo " [INFO] Users can safely cut power / flip breakers anytime."
echo " [INFO] To update files later: run 'sudo edit-system'"
echo " [INFO] Reboot IOT2050 to activate: reboot"
echo "==========================================================="