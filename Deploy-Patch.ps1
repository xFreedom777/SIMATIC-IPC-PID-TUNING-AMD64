# ==============================================================================
# MITRPHOL AMD64 IPC (Dell OptiPlex 3000 / Ubuntu) 24/7 Deployment Script
# Developed by Dream Piyapong (xFreedom777)
# ==============================================================================

try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    chcp 65001 > $null
} catch {}

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  MITRPHOL AMD64 IPC (Dell OptiPlex 3000) 24/7 Patch" -ForegroundColor Cyan
Write-Host "  >> Developed by Dream Piyapong (xFreedom777) <<" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Get IP Address
$target_ip = Read-Host "Enter Dell OptiPlex IP Address [Press Enter for 192.168.121.214]"
if ([string]::IsNullOrWhiteSpace($target_ip)) { $target_ip = "192.168.121.214" }

# Get Username
$target_user = Read-Host "Enter SSH Username [Press Enter for xadmin]"
if ([string]::IsNullOrWhiteSpace($target_user)) { $target_user = "xadmin" }

# Get Destination Path
$target_path = Read-Host "Enter Destination Path on Target [Press Enter for /opt/pid-tuning-app]"
if ([string]::IsNullOrWhiteSpace($target_path)) { $target_path = "/opt/pid-tuning-app" }

Write-Host "`n--> Initializing staging folder on target machine..." -ForegroundColor Cyan
ssh ${target_user}@${target_ip} "mkdir -p /tmp/pid-staging/public/css /tmp/pid-staging/public/js /tmp/pid-staging/src"

Write-Host "`n[1/10] Uploading index.html (Wi-Fi Modal & Touch Numpad)..." -ForegroundColor Yellow
scp .\public\index.html ${target_user}@${target_ip}:/tmp/pid-staging/public/

Write-Host "[2/10] Uploading splash.html (Smart Polling / No Blank Screen)..." -ForegroundColor Yellow
scp .\public\splash.html ${target_user}@${target_ip}:/tmp/pid-staging/public/

Write-Host "[3/10] Uploading style.css..." -ForegroundColor Yellow
scp .\public\css\style.css ${target_user}@${target_ip}:/tmp/pid-staging/public/css/

Write-Host "[4/10] Uploading app.js (AMD64 60fps GPU + Setpoint PIN Lock)..." -ForegroundColor Yellow
scp .\public\js\app.js ${target_user}@${target_ip}:/tmp/pid-staging/public/js/

Write-Host "[5/10] Uploading server.js (Backend & Wi-Fi APIs)..." -ForegroundColor Yellow
scp .\server.js ${target_user}@${target_ip}:/tmp/pid-staging/

Write-Host "[6/10] Uploading generate-usb-viewer.js..." -ForegroundColor Yellow
scp .\generate-usb-viewer.js ${target_user}@${target_ip}:/tmp/pid-staging/

Write-Host "[7/10] Uploading s7client.js..." -ForegroundColor Yellow
scp .\src\s7client.js ${target_user}@${target_ip}:/tmp/pid-staging/src/

Write-Host "[8/10] Uploading USB Helpers & 24/7 Stability Scripts..." -ForegroundColor Yellow
scp .\usb-mount-helper.sh ${target_user}@${target_ip}:/tmp/pid-staging/
scp .\usb-unmount-helper.sh ${target_user}@${target_ip}:/tmp/pid-staging/
scp .\setup-247-stability.sh ${target_user}@${target_ip}:/tmp/pid-staging/

Write-Host "[9/10] Uploading Self-Healing Watchdog (Multi-browser & Timeout Proof)..." -ForegroundColor Yellow
scp .\kiosk-watchdog.sh ${target_user}@${target_ip}:/tmp/pid-staging/

Write-Host "[10/10] Uploading Systemd Services..." -ForegroundColor Yellow
scp .\pid-app.service ${target_user}@${target_ip}:/tmp/pid-staging/
scp .\kiosk-watchdog.service ${target_user}@${target_ip}:/tmp/pid-staging/
scp .\kiosk.service ${target_user}@${target_ip}:/tmp/pid-staging/

Write-Host "`n[OK] All files uploaded to staging!" -ForegroundColor Green
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Applying Files & Restarting Production Services..." -ForegroundColor Cyan
Write-Host "  >> Enter sudo password for $target_user if prompted <<" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# Use sudo to copy from staging to /opt/pid-tuning-app and reload services
ssh -t ${target_user}@${target_ip} "sudo mkdir -p ${target_path}/public/css ${target_path}/public/js ${target_path}/src && sudo cp -rf /tmp/pid-staging/* ${target_path}/ && sudo chmod +x ${target_path}/*.sh && sudo cp ${target_path}/*.service /etc/systemd/system/ 2>/dev/null || true && sudo systemctl daemon-reload && sudo systemctl restart pid-app.service kiosk.service kiosk-watchdog.service && rm -rf /tmp/pid-staging && if [ -d /media/root-ro ]; then sudo mount -o remount,rw /media/root-ro 2>/dev/null || true; sudo mkdir -p /media/root-ro${target_path}/src /media/root-ro/etc/systemd/system; sudo cp -rf ${target_path}/* /media/root-ro${target_path}/ 2>/dev/null || true; sudo cp -rf ${target_path}/src/* /media/root-ro${target_path}/src/ 2>/dev/null || true; sudo cp -f /etc/systemd/system/pid-app.service /media/root-ro/etc/systemd/system/ 2>/dev/null || true; sudo cp -f /etc/systemd/system/kiosk.service /media/root-ro/etc/systemd/system/ 2>/dev/null || true; sudo cp -f /etc/systemd/system/kiosk-watchdog.service /media/root-ro/etc/systemd/system/ 2>/dev/null || true; sync; sudo mount -o remount,ro /media/root-ro 2>/dev/null || true; fi"

Write-Host "`n[OK] Deployment Complete! Services restarted." -ForegroundColor Green
Write-Host "     >> System Maintained by Dream Piyapong <<" -ForegroundColor Yellow

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT COMPLETE — DELL OPTIPLEX 3000 READY!" -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

$doReboot = Read-Host "Reboot Dell OptiPlex now to test clean startup? (Y/N) [Default: N]"
if ($doReboot.ToUpper() -eq "Y") {
    Write-Host ""
    Write-Host "--> Sending reboot command to Target IPC..." -ForegroundColor Yellow
    ssh -t ${target_user}@${target_ip} "sudo reboot"
    Write-Host ""
    Write-Host "[OK] Reboot command sent! OptiPlex 3000 will restart in ~15-20 seconds." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[OK] Services running live! No reboot required." -ForegroundColor Green
}
Write-Host ""
Pause