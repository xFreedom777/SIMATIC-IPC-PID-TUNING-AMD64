# 🏭 SIMATIC S7-1200 PID TUNING & MONITORING SUITE (V7.0 IPC EDITION)
### ⚡ High-Availability Industrial Kiosk & Process Control System for Lenovo ThinkCentre (AMD64)
**📍 Mitr Phol Pin Mill Plant — Cane Sugar Processing & Gate Valve Regulation**

---

<div align="center">

```ascii
 ███████╗███████╗      ██╗██████╗  ██████╗  ██████╗     ██╗██████╗  ██████╗
 ██╔════╝╚════██║     ███║╚════██╗██╔═████╗██╔════╝     ██║██╔══██╗██╔════╝
 ███████╗    ██╔╝     ╚██║ █████╔╝██║██╔██║███████╗     ██║██████╔╝██║     
 ╚════██║   ██╔╝       ██║██╔═══╝ ████╔╝██║██╔═══██╗    ██║██╔═══╝ ██║     
 ███████║   ██║        ██║███████╗╚██████╔╝╚██████╔╝    ██║██║     ╚██████╗
 ╚══════╝   ╚═╝        ╚═╝╚══════╝ ╚═════╝  ╚═════╝     ╚═╝╚═╝      ╚═════╝
 ─── 24/7 MISSION-CRITICAL INDUSTRIAL AUTOMATION & PROCESS OPTIMIZATION ───
```

[![Node.js](https://img.shields.io/badge/Node.js-20.x%20LTS-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Siemens S7-1200](https://img.shields.io/badge/Siemens-S7--1200%20PLC-009999?style=for-the-badge&logo=siemens&logoColor=white)](https://www.siemens.com/)
[![PIDCompact V2](https://img.shields.io/badge/Algorithm-PIDCompact%20V2-FF6F00?style=for-the-badge&logo=target&logoColor=white)](https://support.industry.siemens.com/)
[![Platform](https://img.shields.io/badge/Platform-Lenovo%20ThinkCentre%20Tiny%20(AMD64)-0052CC?style=for-the-badge&logo=linux&logoColor=white)](https://www.lenovo.com/)
[![Architecture](https://img.shields.io/badge/Arch-x86__64%20%2F%20AMD64-E95420?style=for-the-badge&logo=ubuntu&logoColor=white)](https://ubuntu.com/)
[![Protection](https://img.shields.io/badge/Power--Cut%20Proof-OverlayFS%20Read--Only-FFD700?style=for-the-badge&logo=shield&logoColor=black)](https://github.com/)
[![Display](https://img.shields.io/badge/Display-X11%20Kiosk%20(60FPS%20GPU)-990000?style=for-the-badge&logo=googlechrome&logoColor=white)](https://chromium.googlesource.com/)
[![Author](https://img.shields.io/badge/Engineer-xFreedom777-7928CA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/xFreedom777)

</div>

---

## 📑 สารบัญ (Table of Contents)
- [1. บทนำและบริบทหน้างาน (Plant Overview)](#1-บทนำและบริบทหน้างาน-plant-overview)
- [2. ทำไมต้องย้ายจาก Edge Gateway สู่ Industrial PC (The IPC Evolution)](#2-ทำไมต้องย้ายจาก-edge-gateway-สู่-industrial-pc-the-ipc-evolution)
- [3. สถาปัตยกรรมระบบขั้นสูง (System Architecture)](#3-สถาปัตยกรรมระบบขั้นสูง-system-architecture)
- [4. แผนผังดาต้าบล็อกและโปรโตคอล (Siemens S7 DB120 / PID Mapping)](#4-แผนผังดาต้าบล็อกและโปรโตคอล-siemens-s7-db120--pid-mapping)
- [5. ระบบป้องกันระดับโรงงาน 24/7 (Zero-Downtime & Power-Cut Shield)](#5-ระบบป้องกันระดับโรงงาน-247-zero-downtime--power-cut-shield)
- [6. ขั้นตอนการติดตั้งอัตโนมัติ (1-Click Deployment Guide)](#6-ขั้นตอนการติดตั้งอัตโนมัติ-1-click-deployment-guide)
- [7. รายละเอียดไฟล์ในระบบ (Project Directory Structure)](#7-รายละเอียดไฟล์ในระบบ-project-directory-structure)
- [8. ทีมผู้พัฒนาและลิขสิทธิ์ (Author & Credits)](#8-ทีมผู้พัฒนาและลิขสิทธิ์-author--credits)

---

## 1. บทนำและบริบทหน้างาน (Plant Overview)

ระบบนี้ถูกพัฒนาขึ้นเพื่อใช้งานจริงใน **กระบวนการควบคุมวาล์วเปิด-ปิดและปรับอัตราการไหล (Gate Valve Regulation)** ในไลน์การผลิต **Mitr Phol Pin Mill Plant** โดยหัวใจหลักของกระบวนการขึ้นอยู่กับความเสถียรและความแม่นยำในการคุมลูป **PIDCompact V2** บน **Siemens SIMATIC S7-1200 PLC**

### 🎯 วัตถุประสงค์ของระบบ:
1. **Real-time PID Tuning:** แสดงกราฟเส้นแนวโน้ม (SP / PV / Output / Error) ความละเอียดสูงระดับ 50ms โดยไม่มีอาการหน่วงหรือภาพกระตุก
2. **Online Parameter Adjustment:** ปรับเปลี่ยนค่า $K_p$ (Proportional Gain), $T_i$ (Integral Time), $T_d$ (Derivative Time), และ Manual Output ลงสู่ PLC Data Block ได้ทันทีโดยไม่ต้องเปิด TIA Portal
3. **24/7 Dedicated Touchscreen HMI:** หน้าจอ Kiosk ไร้ขอบ Fullscreen ล็อคการทำงานอัตโนมัติเมื่อเปิดเครื่อง ไม่ต้องมีคีย์บอร์ดหรือเมาส์
4. **Historical Logging & USB Export:** ระบบบันทึกประวัติการปรับจูนลงหน่วยความจำ และเสียบ Flash Drive เพื่อดึงข้อมูลออกเป็นรายงาน PDF/CSV ได้ในคลิกเดียว

---

## 2. ทำไมต้องย้ายจาก Edge Gateway สู่ Industrial PC (The IPC Evolution)

เดิมทีระบบรันอยู่บนบอร์ด **Siemens IOT2050 (ARM Cortex-A53)** แต่เนื่องจากข้อจำกัดด้านกายภาพของฮาร์ดแวร์ระดับ Gateway ระบบจึงได้รับการ Upgrade สถาปัตยกรรมขึ้นสู่ **Lenovo ThinkCentre M70q / M80q Tiny (x86_64 IPC)**:

| คุณลักษณะ (Features) | Siemens IOT2050 (เดิม) | Lenovo ThinkCentre Tiny IPC (ปัจจุบัน V7.0) |
| :--- | :--- | :--- |
| **CPU Architecture** | 4-Core ARM Cortex-A53 (1.1 GHz) | Intel Core i3/i5 / AMD Ryzen (6-12 Cores, 4.0+ GHz) |
| **System RAM** | 1 GB - 2 GB DDR4 (เสี่ยงต่อ OOM Crash) | **8 GB - 16 GB DDR4/DDR5 (High Headroom)** |
| **GPU & Graphics** | Software Rasterizer (CPU 100% เรนเดอร์กราฟ) | **Hardware GPU Acceleration (Intel UHD / Radeon 60 FPS)** |
| **ความลื่นไหลของ UI** | มีอาการกระตุกเมื่อเปิดต่อเนื่องนานเกิน 2 สัปดาห์ | **ลื่นไหลระดับ Real-time 60 FPS เปิดต่อเนื่องได้ไม่จำกัด** |
| **Power-Cut Immunity** | OverlayFS บน RAM ขีดจำกัดสูง | **Full OverlayFS Read-Only Disk + 500MB Dynamic Tmpfs** |
| **เสถียรภาพระยะยาว** | เสี่ยงต่อปัญหาจอภาพ Black Screen จาก Driver | **เสถียร 100% ไม่มีวันจอดำด้วย X11 Native Subsystem** |

---

## 3. สถาปัตยกรรมระบบขั้นสูง (System Architecture)

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
║  │    SELF-HEALING WATCHDOG        │                         │ (Port 102)         ║
║  │  Systemd Health Checker Daemon  │                         │                    ║
║  │  RAM Monitor & Crash Recovery   │                         v                    ║
╚══┴─────────────────────────────────┴─────────────┬────────────────────────────────┴═══╝
                                                   │ Industrial Ethernet
                                                   │ (Cat6 Shielded Cable)
                                                   v
                            ╔═══════════════════════════════════════╗
                            ║          SIEMENS S7-1200 PLC          ║
                            ║   CPU 1214C / 1215C (DC/DC/DC)        ║
                            ║   ─────────────────────────────────   ║
                            ║   • PIDCompact V2 Function Block      ║
                            ║   • DB120: Process Data Block         ║
                            ║   • Real-Time Cycle: 50ms Task        ║
                            ╚═══════════════════════════════════════╝
```

---

## 4. แผนผังดาต้าบล็อกและโปรโตคอล (Siemens S7 DB120 / PID Mapping)

การสื่อสารระหว่าง Node.js และ PLC ใช้ไลบรารี **`nodes7`** สื่อสารผ่าน **ISO-on-TCP (RFC1006 - TCP Port 102)** โดยเข้าถึง Data Block ของ PID ดังนี้:

| Offset | Parameter Name | Data Type | Description / Functionality |
| :---: | :--- | :---: | :--- |
| `+0.0` | **Setpoint (SP)** | `Real (4B)` | ค่าเป้าหมายการควบคุมการเปิดวาล์ว (%) |
| `+4.0` | **Input / Raw PV** | `Real (4B)` | สัญญาณขาเข้าดิบจากเซนเซอร์ Flow / Pressure |
| `+14.0`| **ManualValue** | `Real (4B)` | ค่าเปอร์เซ็นต์เอาต์พุตเมื่ออยู่ใน Manual Mode (0.0 - 100.0%) |
| `+18.0`| **ErrorAck** | `Bool` | บิตสั่งปลด Alarm / Reset Error Acknowledgement |
| `+18.1`| **Reset** | `Bool` | บิตคำสั่ง Hard Reset ลูป PIDCompact |
| `+18.2`| **ModeActivate** | `Bool` | พัลส์เปลี่ยนสถานะ Mode (Rising Edge) |
| `+20.0`| **ScaledInput (PV)** | `Real (4B)` | ค่า Process Variable ที่ผ่านการสเกลแล้ว |
| `+24.0`| **Output** | `Real (4B)` | สัญญาณเอาต์พุตสั่งเปิด-ปิดวาล์ว (4-20mA Control Valve) |
| `+32.0`| **State** | `Int (2B)` | สถานะ PID (0=Inactive, 3=Automatic, 4=Manual) |
| `+40.0`| **Mode** | `Int (2B)` | โหมดการทำงานที่ต้องการเลือก |
| `+50.0`| **Gain (Kp)** | `Real (4B)` | ค่า Proportional Gain ของคอนโทรลเลอร์ |
| `+54.0`| **TI (Tn)** | `Real (4B)` | ค่า Integral Time (Reset Time ในหน่วยวินาที) |
| `+58.0`| **TD (Tv)** | `Real (4B)` | ค่า Derivative Time (Rate Time ในหน่วยวินาที) |

---

## 5. ระบบป้องกันระดับโรงงาน 24/7 (Zero-Downtime & Power-Cut Shield)

### 🛡️ 1. ระบบป้องกันไฟล์พังจากไฟดับกระชาก (OverlayFS Read-Only Root)
* ตัวระบบปฏิบัติการทั้งหมดจะถูก Mount เป็น **Read-Only (อ่านอย่างเดียว)**
* ไฟล์ชั่วคราว, Log และ Cache ทั้งหมดจะถูกเก็บลงใน **RAM Overlay (Tmpfs)**
* **ผลลัพธ์:** ปิดสวิตช์ตู้คอนโทรล หรือไฟโรงงานดับกะทันหัน **SSD จะไม่มีวันพัง และไฟล์ระบบจะไม่มีวัน Corrupt 100%**

### 🔄 2. ระบบเฝ้าระวังอัตโนมัติ (Self-Healing Watchdog Daemon)
* ตรวจสอบ Health Endpoint (`http://localhost:3000/api/status`) ทุก ๆ 20 วินาที
* หากโปรเซสของ Chromium หรือ Node.js หยุดทำงาน Watchdog จะสั่ง **Soft-Restart Service** ทันทีภายใน 3 วินาที
* ปรับแต่ง Memory Cache รายวันอัตโนมัติเวลา **03:00 น.** เพื่อคืนหน่วยความจำให้ระบบ

### 💾 3. ระบบ Auto-Mount USB แบบปลอดภัยต่อระบบปฏิบัติการ
* ป้องกันบั๊กการเมานต์ทับ OS Root Partition บนไดรฟ์ SSD/NVMe
* ตรวจจับ Flash Drive (FAT32, NTFS, exFAT) อัตโนมัติและผูกเข้ากับ `/media/usb` ทันทีที่เสียบ

---

## 6. ขั้นตอนการติดตั้งอัตโนมัติ (1-Click Deployment Guide)

### 📋 สิ่งที่ต้องเตรียม:
1. เครื่อง **Lenovo ThinkCentre M70q / M80q Tiny (AMD64)** ติดตั้ง **Debian 12 64-bit** หรือ **Ubuntu 22.04/24.04 LTS**
2. เสียบสาย LAN เข้ากับวงเครือข่ายของ PLC S7-1200

### 🚀 คำสั่งติดตั้งเดียวจบ (One-Command Deployment):
```bash
# 1. เข้าสู่โฟลเดอร์โปรเจกต์
cd MITRPHOL-AMD64

# 2. รันสคริปต์ตัวติดตั้งอัตโนมัติ
sudo bash deploy-lenovo-amd64.sh

# 3. รีบูตเครื่องเพื่อเปิดระบบ Kiosk แบบเต็มรูปแบบ
sudo reboot
```

---

## 7. รายละเอียดไฟล์ในระบบ (Project Directory Structure)

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

## 8. ทีมผู้พัฒนาและลิขสิทธิ์ (Author & Credits)

* **Lead Automation & OT/IT Engineer:** Dream Piyapong (**[xFreedom777](https://github.com/xFreedom777)**)
* **Direct Contact:** [xDev.0777@gmail.com](mailto:xDev.0777@gmail.com)
* **Deployment Site:** Mitr Phol Pin Mill Plant
* **Release Version:** `v7.0-amd64-production`
* **License:** [MIT License](LICENSE) — Production Ready for Industrial Applications

---

<div align="center">
<b>MADE WITH PASSION & DEDICATION FOR INDUSTRIAL AUTOMATION EXCELLENCE 🇹🇭⚡</b>
</div>
