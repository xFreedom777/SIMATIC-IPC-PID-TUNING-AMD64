#!/bin/bash
# ==============================================================================
# Siemens S7-1200 PID Tuning System - 1-Click Installer for Lenovo ThinkCentre (AMD64)
# Target OS: Debian 12 (Bookworm) / Ubuntu 22.04 or 24.04 LTS (x86_64 / AMD64)
# Plant: Mitr Phol Pin Mill Plant
# ==============================================================================
set -e

echo "====================================================================="
echo "  🚀 Installing PID Tuning Kiosk System on Lenovo ThinkCentre (AMD64)"
echo "====================================================================="

if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root: sudo ./deploy-lenovo-amd64.sh"
  exit 1
fi

APP_DIR="/opt/pid-tuning-app"
CURRENT_DIR=$(pwd)

echo "--> [1/8] Updating package lists & installing system dependencies..."
apt-get update -y
apt-get install -y curl wget git xorg openbox chromium-browser                    ntfs-3g exfat-fuse exfatprogs util-linux                    overlayroot systemd-sysv

# Install Node.js 20.x LTS if not installed or version < 18
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt 18 ]; then
  echo "--> [2/8] Installing Node.js 20.x LTS (x86_64)..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "--> Node version: $(node -v) | NPM version: $(npm -v)"

# Copy application files to /opt/pid-tuning-app
echo "--> [3/8] Deploying application files to ${APP_DIR}..."
mkdir -p "${APP_DIR}"
mkdir -p "${APP_DIR}/logs"
mkdir -p "${APP_DIR}/data"
mkdir -p /media/usb

cp -r ./* "${APP_DIR}/" 2>/dev/null || true
cd "${APP_DIR}"

# Remove old ARM node_modules if present and install fresh AMD64 dependencies
echo "--> [4/8] Installing fresh Node.js dependencies for AMD64..."
rm -rf node_modules package-lock.json
npm install --production --unsafe-perm

# Set permissions
chmod +x "${APP_DIR}"/*.sh 2>/dev/null || true
chmod 777 "${APP_DIR}/logs"
chmod 777 /media/usb

# Configure X11 permissions for Root/Any user
echo "--> [5/8] Configuring X11 Display server permissions..."
mkdir -p /etc/X11
cat << 'EOF' > /etc/X11/Xwrapper.config
allowed_users=anybody
needs_root_rights=yes
EOF

# Install ~/.xinitrc for Root Kiosk
echo "--> [6/8] Configuring 24/7 Kiosk Launcher (~/.xinitrc)..."
cat << 'EOF' > /root/.xinitrc
#!/bin/bash
# Lenovo ThinkCentre AMD64 24/7 Kiosk Launcher

# Disable screen blanking & DPMS power saving
xset -dpms
xset s off
xset s noblank
xset s 0 0
setterm -blank 0 -powerdown 0 2>/dev/null || true

# Cursor styling
xsetroot -cursor_name left_ptr &

# Clear previous Chromium crash locks & restore profiles
rm -rf /root/.config/chromium/Singleton*
rm -rf /root/.config/chromium/Default/WebData*
find /root/.config/chromium -name "Preferences" -exec sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' {} + 2>/dev/null || true
find /root/.config/chromium -name "Preferences" -exec sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' {} + 2>/dev/null || true

# Continuous Kiosk Loop with GPU Acceleration Enabled (Intel/AMD UHD Graphics)
while true; do
  chromium     --no-sandbox     --disable-dev-shm-usage     --no-first-run     --password-store=basic     --kiosk     --start-fullscreen     --start-maximized     --window-size=1920,1080     --window-position=0,0     --disable-infobars     --disable-session-crashed-bubble     --enable-gpu-rasterization     --enable-zero-copy     --disk-cache-size=104857600     --autoplay-policy=no-user-gesture-required     --force-device-scale-factor=1.0     http://localhost:3000/splash.html

  sleep 2
done
EOF
chmod +x /root/.xinitrc

# Install Systemd Services
echo "--> [7/8] Registering & enabling Systemd Services..."
cp "${APP_DIR}/pid-app.service" /etc/systemd/system/pid-app.service
cp "${APP_DIR}/kiosk.service" /etc/systemd/system/kiosk.service
cp "${APP_DIR}/kiosk-watchdog.service" /etc/systemd/system/kiosk-watchdog.service 2>/dev/null || true

systemctl daemon-reload
systemctl enable pid-app.service
systemctl enable kiosk.service
if [ -f /etc/systemd/system/kiosk-watchdog.service ]; then
  systemctl enable kiosk-watchdog.service
fi

# Apply system stability settings
echo "--> [8/8] Applying 24/7 Industrial Stability settings..."
bash "${APP_DIR}/setup-247-stability.sh" || true

echo "====================================================================="
echo "  ✅ INSTALLATION COMPLETED SUCCESSFULLY!"
echo "====================================================================="
echo "  👉 To start services now, run:"
echo "     systemctl start pid-app.service"
echo "     systemctl start kiosk.service"
echo "     systemctl start kiosk-watchdog.service"
echo ""
echo "  👉 Or simply REBOOT the machine: sudo reboot"
echo "====================================================================="
