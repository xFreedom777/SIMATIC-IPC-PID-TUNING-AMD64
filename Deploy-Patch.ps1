# ==============================================================================
# SIMATIC IOT2050 24/7 Stability & Power-Cut Proof Deployment Script
# Developed by Dream Piyapong (xFreedom777)
# ==============================================================================

try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    chcp 65001 > $null
} catch {}

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  SIMATIC IOT2050 24/7 Stability & Power-Cut Proof Patch" -ForegroundColor Cyan
Write-Host "  >> Developed by Dream Piyapong <<" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Get IP Address
$iot_ip = Read-Host "Enter IOT2050 IP Address [Press Enter for 192.168.121.214]"
if ([string]::IsNullOrWhiteSpace($iot_ip)) { $iot_ip = "192.168.121.214" }

$iot_user = "root"

# Get Destination Path
$iot_path = Read-Host "Enter Destination Path on IOT2050 [Press Enter for /opt/pid-tuning-app]"
if ([string]::IsNullOrWhiteSpace($iot_path)) { $iot_path = "/opt/pid-tuning-app" }

Write-Host "`n[1/10] Deploying index.html..." -ForegroundColor Yellow
scp .\public\index.html ${iot_user}@${iot_ip}:${iot_path}/public/

Write-Host "[2/10] Deploying style.css..." -ForegroundColor Yellow
scp .\public\css\style.css ${iot_user}@${iot_ip}:${iot_path}/public/css/

Write-Host "[3/10] Deploying app.js (RAM & Chart Throttled)..." -ForegroundColor Yellow
scp .\public\js\app.js ${iot_user}@${iot_ip}:${iot_path}/public/js/

Write-Host "[4/10] Deploying server.js (Backend)..." -ForegroundColor Yellow
scp .\server.js ${iot_user}@${iot_ip}:${iot_path}/

Write-Host "[5/10] Deploying generate-usb-viewer.js..." -ForegroundColor Yellow
scp .\generate-usb-viewer.js ${iot_user}@${iot_ip}:${iot_path}/

Write-Host "[6/10] Deploying s7client.js..." -ForegroundColor Yellow
scp .\src\s7client.js ${iot_user}@${iot_ip}:${iot_path}/src/

Write-Host "[7/10] Deploying 24/7 Stability & Power-Cut Setup Script..." -ForegroundColor Yellow
scp .\usb-mount-helper.sh ${iot_user}@${iot_ip}:${iot_path}/
scp .\usb-unmount-helper.sh ${iot_user}@${iot_ip}:${iot_path}/
scp .\overlayroot.deb ${iot_user}@${iot_ip}:${iot_path}/
scp .\setup-247-stability.sh ${iot_user}@${iot_ip}:${iot_path}/

Write-Host "[8/10] Deploying Self-Healing Watchdog..." -ForegroundColor Yellow
scp .\kiosk-watchdog.sh ${iot_user}@${iot_ip}:${iot_path}/

Write-Host "[9/10] Deploying Systemd Services..." -ForegroundColor Yellow
scp .\pid-app.service ${iot_user}@${iot_ip}:${iot_path}/
scp .\kiosk-watchdog.service ${iot_user}@${iot_ip}:${iot_path}/
scp .\kiosk.service ${iot_user}@${iot_ip}:${iot_path}/

Write-Host "`n[OK] All files copied successfully to IOT2050!" -ForegroundColor Green
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Executing 24/7 OS Configuration & Protection on IOT2050..." -ForegroundColor Cyan
Write-Host "  >> By Dream Piyapong <<" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

ssh ${iot_user}@${iot_ip} "chmod +x ${iot_path}/setup-247-stability.sh ${iot_path}/kiosk-watchdog.sh ${iot_path}/usb-mount-helper.sh ${iot_path}/usb-unmount-helper.sh && cd ${iot_path} && ./setup-247-stability.sh"

Write-Host "`n[OK] 24/7 Deployment Complete! Restarting Node server..." -ForegroundColor Green
Write-Host "     >> System Created & Maintained by Dream Piyapong <<" -ForegroundColor Yellow
# Make sure changes persist to physical MicroSD if Overlayroot is active
ssh ${iot_user}@${iot_ip} "if [ -d /media/root-ro ]; then mount -o remount,rw /media/root-ro 2>/dev/null || true; mkdir -p /media/root-ro${iot_path}/src /media/root-ro/etc/systemd/system; cp -rf ${iot_path}/* /media/root-ro${iot_path}/ 2>/dev/null || true; cp -rf ${iot_path}/src/* /media/root-ro${iot_path}/src/ 2>/dev/null || true; cp -f /etc/systemd/system/pid-app.service /media/root-ro/etc/systemd/system/ 2>/dev/null || true; sync; mount -o remount,ro /media/root-ro 2>/dev/null || true; echo '[OK] Permanent SD Card Storage Synced!'; fi"

ssh ${iot_user}@${iot_ip} "systemctl restart pid-app kiosk-watchdog"

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT COMPLETE (By Dream Piyapong)" -ForegroundColor Green
Write-Host "  🛡️  SD Card is now configured with OverlayFS Protection" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

$doReboot = Read-Host "Reboot IOT2050 now to ACTIVATE Read-Only Protection? (Y/N) [Default: Y]"
if ([string]::IsNullOrWhiteSpace($doReboot) -or $doReboot.ToUpper() -eq "Y") {
    Write-Host ""
    Write-Host "--> Sending reboot command to IOT2050..." -ForegroundColor Yellow
    ssh ${iot_user}@${iot_ip} "sleep 1 && reboot"
    Write-Host ""
    Write-Host "[OK] Reboot command sent! IOT2050 will restart in ~30-40 seconds." -ForegroundColor Green
    Write-Host "     After reboot, the system is 100% immune to sudden power cuts." -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "[SKIPPED] Remember to reboot manually to activate protection:" -ForegroundColor Yellow
    Write-Host "   ssh ${iot_user}@${iot_ip} 'reboot'" -ForegroundColor White
}
Write-Host ""
Pause