# 🏭 SIMATIC S7-1200 PID TUNING & MONITORING SUITE (V7.0 IPC EDITION)
### ⚡ Mission-Critical Industrial Kiosk & Process Control System for Lenovo ThinkCentre (AMD64)
**📍 Mitr Phol Pin Mill Plant — Cane Sugar Processing & Gate Valve Regulation**

---

<div align="center">

```ascii
 ███████╗███████╗    ██╗██████╗ ██╗██╗  ██╗    ██╗██████╗  ██████╗
 ██╔════╝╚════██║    ██║╚════██╗██║██║  ██║    ██║██╔══██╗██╔════╝
 ███████╗    ██╔╝    ██║ █████╔╝██║███████║    ██║██████╔╝██║     
 ╚════██║   ██╔╝     ██║██╔═══╝ ██║╚════██║    ██║██╔═══╝ ██║     
 ███████║   ██║      ██║███████╗██║     ██║    ██║██║     ╚██████╗
 ╚══════╝   ╚═╝      ╚═╝╚══════╝╚═╝     ╚═╝    ╚═╝╚═╝      ╚═════╝
 ─── S 7 - 1 2 1 4 C   I P C   M I T R P H O L   E D I T I O N ───
```

[![Node.js](https://img.shields.io/badge/Node.js-20.x%20LTS-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Siemens S7-1200](https://img.shields.io/badge/Siemens-S7--1200%20PLC-009999?style=for-the-badge&logo=siemens&logoColor=white)](https://www.siemens.com/)
[![PIDCompact V2](https://img.shields.io/badge/Algorithm-PIDCompact%20V2-FF6F00?style=for-the-badge&logo=target&logoColor=white)](https://support.industry.siemens.com/)
[![Platform](https://img.shields.io/badge/Platform-Lenovo%20ThinkCentre%20Tiny%20(AMD64)-0052CC?style=for-the-badge&logo=linux&logoColor=white)](https://www.lenovo.com/)
[![Architecture](https://img.shields.io/badge/Arch-x86__64%20%2F%20AMD64-E95420?style=for-the-badge&logo=ubuntu&logoColor=white)](https://ubuntu.com/)
[![Protection](https://img.shields.io/badge/Power--Cut%20Proof-OverlayFS%20Read--Only-FFD700?style=for-the-badge&logo=shield&logoColor=black)](https://github.com/)
[![Display](https://img.shields.io/badge/Display-X11%20Kiosk%20(60FPS%20GPU)-990000?style=for-the-badge&logo=googlechrome&logoColor=white)](https://chromium.googlesource.com/)
[![Author](https://img.shields.io/badge/Engineer-xFreedom777-7928CA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/xFreedom777)

[English Documentation](#-english-documentation) • [ภาษาไทย (Thai Documentation)](#-ฉบับภาษาไทย-thai-documentation)

</div>

---

# 🌐 ENGLISH DOCUMENTATION

## 1. Plant Context & Executive Summary

The **SIMATIC S7-1200 PID Tuning & Monitoring Suite (V7.0)** is an industrial-grade process automation software package deployed at **Mitr Phol Pin Mill Plant**. It is specifically engineered to regulate high-precision **Gate Valve positions and fluid flow loops** driven by **Siemens S7-1214C PLCs (PIDCompact V2 algorithm)**.

This system bridges the gap between **Operational Technology (OT)** and **Information Technology (IT)** by providing a 60 FPS real-time operator HMI, non-intrusive online PID parameter calibration, automated telemetry data logging, and complete immunity to industrial power fluctuations.

### 🌟 Core Objectives:
* **High-Frequency Telemetry:** 50ms polling cycle over ISO-on-TCP (RFC1006) for instantaneous SP, PV, Output, and Error visualization.
* **Online Parameter Tuning:** Direct real-time read/write access to $K_p$, $T_i$, $T_d$, and Manual Output values without requiring Siemens TIA Portal engineering workstations.
* **Industrial Hardened Kiosk:** Automated boot-to-fullscreen X11 graphical display environment running 24/7 without peripheral dependencies (keyboard/mouse-free operation).
* **Power-Cut Immunity:** OverlayFS-backed read-only filesystem architecture ensuring zero filesystem corruption during emergency plant shutdowns.

---

## 2. Engineering Evolution: Gateway vs Industrial PC

Originally hosted on an embedded **Siemens IOT2050 Edge Gateway (ARM Cortex-A53)**, production workloads revealed severe memory and GPU rasterization bottlenecks when rendering high-frequency Canvas graphs 24/7. 

The architecture has been evolved to **Lenovo ThinkCentre M70q / M80q Tiny (x86_64 / AMD64 IPC)**:

| Engineering Parameter | Siemens IOT2050 (Legacy) | Lenovo ThinkCentre Tiny IPC (V7.0 AMD64) | Impact on Production |
| :--- | :--- | :--- | :--- |
| **CPU Architecture** | 4-Core ARM Cortex-A53 (1.1 GHz) | **Intel Core i3/i5 / AMD Ryzen (6-12 Cores, 4.0+ GHz)** | 15x computational headroom |
| **System Memory (RAM)** | 1 GB - 2 GB DDR4 | **8 GB - 16 GB DDR4/DDR5** | Eliminates OOM crashes completely |
| **Graphics Subsystem** | Software Rasterizer (CPU 100%) | **Hardware GPU Acceleration (Intel UHD / AMD Radeon)** | Smooth 60 FPS Canvas rendering |
| **Display Reliability** | Periodic DRM/DPMS sleep dropouts | **Native X11 / DRM DisplayPort/HDMI 24/7 Active** | Zero black-screen incidents |
| **Power-Cut Shielding** | Limited RAM Overlay | **Full OverlayFS Read-Only Root + 500MB Tmpfs** | 100% Solid-State Drive longevity |
| **USB Data Export** | Fixed Block Device Assumptions | **Multi-FS Dynamic Auto-Mount (FAT32, NTFS, exFAT)** | Seamless data extraction |

---

## 3. High-Level System Architecture

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                      LENOVO THINKCENTRE TINY (AMD64 IPC)                          ║
║                                                                                   ║
║  ┌─────────────────────────────────┐       ┌───────────────────────────────────┐  ║
║  │      X11 KIOSK DISPLAY UI       │       │         NODE.JS CORE ENGINE       │  ║
║  │  Chromium Fullscreen Engine     │       │     Express.js + ws (WebSocket)   │  ║
║  │  Hardware GPU Canvas Renderer   │ <───> │     Dynamic GC & Session Memory   │  ║
║  │  HTML5 + CSS Glassmorphism      │  WS   │     (/opt/pid-tuning-app)         │  ║
║  └─────────────────────────────────┘ (JSON)└─────────────────┬─────────────────┘  ║
║                                                              │                    ║
║  ┌─────────────────────────────────┐                         │ ISO-on-TCP         ║
║  │    SELF-HEALING WATCHDOG        │                         │ (TCP Port 102)     ║
║  │  Systemd Health Checker Daemon  │                         │                    ║
║  │  RAM Monitor & Crash Recovery   │                         v                    ║
╚══┴─────────────────────────────────┴─────────────┬────────────────────────────────┴═══╝
                                                   │ Industrial Ethernet
                                                   │ (Cat6 Shielded Cable)
                                                   v
                            ╔═══════════════════════════════════════╗
                            ║          SIEMENS S7-1200 PLC          ║
                            ║   CPU 1214C (DC/DC/DC) (DC/DC/DC)        ║
                            ║   ─────────────────────────────────   ║
                            ║   • PIDCompact V2 Function Block      ║
                            ║   • DB120: Process Data Block         ║
                            ║   • Real-Time Cycle: 50ms Task        ║
                            ╚═══════════════════════════════════════╝
```

---

## 4. Siemens S7 Memory & Tag Map (DB120 Offset Specification)

Direct memory exchange is established using **`nodes7`** over **ISO-on-TCP (RFC1006, Port 102)** targeting Siemens `PIDCompact V2` instances:

| Byte Offset | Parameter Name | Data Type | Engineering Function |
| :---: | :--- | :---: | :--- |
| `+0.0` | **Setpoint (SP)** | `Real (4B)` | Valve target position / flow rate demand (%) |
| `+4.0` | **Input (Raw PV)** | `Real (4B)` | Raw sensor feedback signal before scaling |
| `+14.0`| **ManualValue** | `Real (4B)` | Manual override valve command (0.0 - 100.0%) |
| `+18.0`| **ErrorAck** | `Bool` | Rising-edge alarm acknowledgement |
| `+18.1`| **Reset** | `Bool` | Hard controller re-initialization flag |
| `+18.2`| **ModeActivate** | `Bool` | Trigger signal for controller state transitions |
| `+20.0`| **ScaledInput (PV)** | `Real (4B)` | Scaled process variable for UI display |
| `+24.0`| **Output** | `Real (4B)` | 4-20mA control output to actuator (%) |
| `+32.0`| **State** | `Int (2B)` | Operating state (0=Inactive, 3=Auto, 4=Manual) |
| `+40.0`| **Mode** | `Int (2B)` | Requested target operating mode |
| `+50.0`| **Gain (Kp)** | `Real (4B)` | Proportional gain coefficient |
| `+54.0`| **TI (Tn)** | `Real (4B)` | Integral reset time in seconds |
| `+58.0`| **TD (Tv)** | `Real (4B)` | Derivative rate time in seconds |

---

## 5. Industrial Hardening & Power-Cut Shield

### 🛡️ 1. OverlayFS Read-Only Storage (Power-Cut Proof)
* The root filesystem is mounted strictly **Read-Only** utilizing `overlayroot`.
* All write requests, ephemeral logs, and browser caches are redirected into a volatile **RAM Tmpfs overlay**.
* **Impact:** Immediate cabinet power shutoffs cause **zero disk corruption** and **zero filesystem inconsistency**.

### 🔄 2. Self-Healing Watchdog Daemon (`kiosk-watchdog.sh`)
* Polls the internal application health endpoint (`http://localhost:3000/api/status`) every 20 seconds.
* Automatically performs soft service recovery if either the Node.js backend or Chromium display process terminates unexpectedly.
* Performs automated off-peak memory reclamation at **03:00 AM daily**.

### 💾 3. Safe USB Mass Storage Auto-Mount
* Intelligently scans block devices (`/dev/sd*`, `/dev/nvme*`) while strictly isolating and ignoring active OS partitions.
* Seamlessly supports **FAT32**, **NTFS**, and **exFAT** USB drives for log extraction at `/media/usb`.

---

## 6. One-Command Fast Deployment Guide

### Prerequisites:
1. **Target Machine:** Lenovo ThinkCentre Tiny (M70q / M80q Gen 4 or equivalent AMD64 PC).
2. **OS:** Clean installation of **Debian 12 (Bookworm) 64-bit** or **Ubuntu 22.04 / 24.04 LTS Desktop**.
3. **Network:** Static IP assigned matching the S7-1200 PLC subnet.

### Execution:
```bash
# 1. Navigate to the project directory
cd MITRPHOL-AMD64

# 2. Execute the automated 1-click deployment script
sudo bash deploy-lenovo-amd64.sh

# 3. Reboot the machine to launch 24/7 Kiosk mode
sudo reboot
```

---

# 🇹🇭 ฉบับภาษาไทย (THAI DOCUMENTATION)

## 1. บทนำและบริบทหน้างาน (Plant Context)

ระบบ **SIMATIC S7-1200 PID Tuning & Monitoring Suite (V7.0)** พัฒนาขึ้นเพื่อควบคุม **Gate Valve และลูปควบคุมอัตราการไหล** ในไลน์การผลิต **Mitr Phol Pin Mill Plant** โดยสื่อสารโดยตรงกับฟังก์ชันบล็อก **PIDCompact V2** บน **Siemens S7-1214C PLC**

ระบบนี้ถูกออกแบบมาเพื่อแก้ปัญหาระบบกระตุก จอดำ และความเสี่ยงจากไฟดับในโรงงาน โดยยกระดับสถาปัตยกรรมจากบอร์ด Edge Gateway ขึ้นสู่ **Industrial PC (Lenovo ThinkCentre Tiny AMD64)**

---

## 2. ทำไมต้องเปลี่ยนเป็น Lenovo ThinkCentre Tiny (AMD64 IPC)?

* **แก้ปัญหา RAM หมด (OOM Crash):** เพิ่มหน่วยความจำเป็น 8GB - 16GB หมดปัญหา Watchdog สั่งรีสตาร์ตวนลูป
* **เรนเดอร์กราฟิกด้วย GPU แท้ (60 FPS):** เปิดใช้งาน Hardware GPU Acceleration ของ Intel/AMD หน้าจอวาดกราฟเส้น Real-time ได้ลื่นไหลต่อเนื่อง
* **ระบบกันไฟดับ (OverlayFS Read-Only):** ปิดสวิตช์ตู้ไฟได้ทันทีโดยไม่ต้อง Shutdown ไฟล์ระบบไม่พัง 100%
* **ระบบ Watchdog อัจฉริยะ:** คอยตรวจสอบสถานะ Service และฟื้นฟูหน้าจออัตโนมัติหากเกิดข้อผิดพลาด

---

## 3. ขั้นตอนการติดตั้งหน้างาน (คำสั่งเดียวจบ)

1. คัดลอกโฟลเดอร์ `MITRPHOL-AMD64` ใส่ Flash Drive ไปไว้บนเครื่อง Lenovo
2. เปิด Terminal แล้วรันคำสั่ง:
   ```bash
   cd MITRPHOL-AMD64
   sudo bash deploy-lenovo-amd64.sh
   sudo reboot
   ```
3. เมื่อเครื่องเปิดขึ้นมา จะเข้าสู่หน้าจอควบคุม PID เต็มจอ (Fullscreen Kiosk) พร้อมใช้งานทันที

---

## 📂 โครงสร้างไฟล์ในระบบ (Project Directory Structure)

```
MITRPHOL-AMD64/
├── public/                         # 🎨 Frontend Web UI & Dashboard
│   ├── css/style.css               # สไตล์ลิ่งธีม Industrial Dark Glassmorphism
│   ├── js/app.js                   # Logic ฝั่ง Client, WebSocket Client & Controls
│   ├── js/chart.js                 # ระบบวาดกราฟเส้น Real-time Canvas Renderer (60 FPS)
│   ├── index.html                  # หน้าจอหลักควบคุมและแสดงผล PID Tuning
│   └── splash.html                 # หน้าจอโหลดและตรวจสอบสถานะการเชื่อมต่อ
├── src/                            # ⚙️ Backend Core Modules
│   ├── s7client.js                 # โมดูลสื่อสาร Siemens S7 Protocol (nodes7 TCP 102)
│   └── simulator.js                # FOPDT (First-Order Plus Dead Time) Process Simulator
├── server.js                       # 🚀 Main Express & WebSocket Server Engine
├── deploy-lenovo-amd64.sh           # 📦 สคริปต์ 1-Click Installer สำหรับ Lenovo ThinkCentre
├── setup-247-stability.sh          # 🛡️ สคริปต์ตั้งค่าความเสถียร 24/7 และ Kernel Blanking
├── kiosk-watchdog.sh               # 👁️ Daemon เฝ้าระวังและฟื้นฟูระบบอัตโนมัติ
├── usb-mount-helper.sh             # 💾 สคริปต์จัดการ USB Flash Drive ปลอดภัยระดับโรงงาน
├── pid-app.service                 # 🔌 Systemd Service สำหรับ Backend Server
├── kiosk.service                   # 🖥️ Systemd Service สำหรับ X11 Kiosk Display
└── package.json                    # 📄 รายการ Dependencies (express, ws, nodes7)
```

---

## 👨‍💻 ผู้พัฒนาและลิขสิทธิ์ (Author & Credits)

* **Lead Automation & OT/IT Engineer:** Dream Piyapong (**[xFreedom777](https://github.com/xFreedom777)**)
* **Direct Contact:** [xDev.0777@gmail.com](mailto:xDev.0777@gmail.com)
* **Deployment Site:** Mitr Phol Pin Mill Plant
* **Release Version:** `v7.0-amd64-production`
* **License:** [MIT License](LICENSE) — Production Ready for Industrial Applications

---

<div align="center">
<b>PROUDLY ENGINEERED FOR INDUSTRIAL AUTOMATION EXCELLENCE 🇹🇭⚡</b>
</div>
