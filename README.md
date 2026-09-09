# SIMATIC S7-1200 PID Tuning Application (AMD64 / IPC Edition) — V7.0

> **[Industrial IPC & Lenovo ThinkCentre Edition / Thai version below 🇹🇭]**

---

<div align="center">

```
███████╗███████╗      ██╗██████╗  ██████╗ 
██╔════╝╚════██║     ███║╚════██╗██╔═████╗
███████╗    ██╔╝     ╚██║ █████╔╝██║██╔██║
╚════██║   ██╔╝       ██║██╔═══╝ ████╔╝██║
███████║   ██║        ██║███████╗╚██████╔╝
╚══════╝   ╚═╝        ╚═╝╚══════╝ ╚═════╝ 
```

**Siemens S7-1200 PLC • PIDCompact V2 • Industrial PC (x86_64 / AMD64)**

*Gate Valve Control & Monitoring System • Mitr Phol Pin Mill Plant*

![Node.js](https://img.shields.io/badge/Node.js-20%2B%20LTS-green?logo=node.js)
![Siemens](https://img.shields.io/badge/Siemens-S7--1200-009999?logo=siemens)
![Platform](https://img.shields.io/badge/Platform-Lenovo%20ThinkCentre%20AMD64-blue?logo=linux)
![Architecture](https://img.shields.io/badge/Arch-x86__64%20%2F%20AMD64-orange)
![Protection](https://img.shields.io/badge/Power--Cut%20Immunity-OverlayFS%20Read--Only-gold)
![Stability](https://img.shields.io/badge/Stability-24%2F7%20Industrial%20IPC-brightgreen)
![Author](https://img.shields.io/badge/Author-xFreedom777-purple)

</div>

---

## 🇹🇭 บทนำ (Overview)

โปรเจกต์นี้คือระบบ **PID Tuning & Gate Valve Monitoring Application (V7.0)** สำหรับโรงงาน **Mitr Phol Pin Mill Plant** ซึ่งได้รับการพัฒนาและยกระดับประสิทธิภาพขึ้นสู่แพลตฟอร์ม **Industrial PC (x86_64 / AMD64 - Lenovo ThinkCentre M70q / M80q Tiny)** 

ระบบนี้ออกแบบมาเพื่อควบคุมและตรวจสอบค่า **PIDCompact V2** ของ **Siemens S7-1200 PLC** แบบ Real-time ผ่านการสื่อสาร S7 Ethernet Protocol พร้อมระบบหน้าจอแสดงผล **X11 Kiosk Display 24/7** และระบบป้องกันไฟล์ระบบเสียหายจากไฟดับกระชาก (**OverlayFS Power-Cut Protection**)

---

## 🚀 ฟีเจอร์หลักของระบบ (Key Features)

1. **High Performance IPC Architecture (x86_64 / AMD64):**
   - ยกระดับจาก Edge Gateway สู่ Industrial PC ขจัดปัญหาคอขวดด้าน RAM (8GB - 16GB) และ CPU
   - เปิดใช้งาน **Hardware GPU Acceleration (Intel UHD / AMD Radeon)** เพื่อการเรนเดอร์กราฟิก Real-time Canvas ที่ลื่นไหล 60 FPS
2. **Siemens S7 Protocol Communication (`nodes7`):**
   - อ่านและเขียนค่า PID Parameters, Setpoint (SP), Process Variable (PV), Output (Out) แบบ Real-time ผ่านพอร์ต TCP 102
3. **24/7 Industrial Stability & Self-Healing Watchdog:**
   - ระบบ **Watchdog Daemon (`kiosk-watchdog.sh`)** คอยตรวจสอบความสมบูรณ์ของ Backend และ Kiosk UI อัตโนมัติ หากเกิดข้อผิดพลาดจะ Restart Service ทันที
4. **Power-Cut Proofing (OverlayFS / Read-Only Root):**
   - ป้องกันอาการระบบบูตไม่ขึ้นจากปัญหาไฟดับในโรงงานด้วย `overlayroot`
5. **Universal Industrial USB Auto-Mount:**
   - ระบบ Export Log ข้อมูลการทำงานลง USB Flash Drive อัตโนมัติ (รองรับ FAT32, NTFS, exFAT) โดยมีระบบตรวจสอบเพื่อความปลอดภัยไม่ให้กระทบต่อดิสก์ระบบ (NVMe/SATA SSD)

---

## 🛠 สถาปัตยกรรมระบบ (System Architecture)

```
+-------------------------------------------------------------------------+
|                  Lenovo ThinkCentre Tiny (x86_64 IPC)                   |
|                                                                         |
|  +---------------------------+       +-------------------------------+  |
|  |     X11 Kiosk Display     | <---> |       Node.js Backend         |  |
|  |   Chromium (Fullscreen)   |  WS   |   Express + WebSockets + s7   |  |
|  |  (GPU Accelerated Canvas) |       |   (/opt/pid-tuning-app)       |  |
|  +---------------------------+       +---------------+---------------+  |
+------------------------------------------------------|------------------+
                                                       | S7 Protocol
                                                       | (TCP Port 102)
                                                       v
                                       +-------------------------------+
                                       |      Siemens S7-1200 PLC      |
                                       |      (PIDCompact V2 Loop)     |
                                       +-------------------------------+
```

---

## 📦 วิธีการติดตั้งแบบ 1-Click (1-Click Deployment Guide)

### สิ่งที่ต้องเตรียม:
1. เครื่อง **Lenovo ThinkCentre Tiny (AMD64)** ติดตั้ง **Debian 12 (Bookworm)** หรือ **Ubuntu 22.04 / 24.04 LTS Desktop**
2. กำหนด IP Address ของการ์ด LAN ให้ตรงกับวงของ PLC S7-1200

### ขั้นตอนการ Deploy:
```bash
# 1. คัดลอกโฟลเดอร์โปรเจกต์มาที่เครื่อง
cd MITRPHOL-AMD64

# 2. รันสคริปต์ติดตั้งระบบทั้งหมดอัตโนมัติ (คำสั่งเดียว)
sudo bash deploy-lenovo-amd64.sh

# 3. สั่งรีบูตเครื่องเพื่อเริ่มการทำงานแบบ 24/7 Kiosk ทันที
sudo reboot
```

---

## 📂 โครงสร้างโปรเจกต์ (Project Structure)

```
MITRPHOL-AMD64/
├── public/                     # Frontend UI (HTML5, Canvas, CSS, WebSocket Client)
│   ├── index.html              # หน้าจอหลักควบคุมและแสดงผล PID Tuning
│   ├── splash.html             # หน้าจอ Loading & Connection Splash
│   └── js/                     # สคริปต์วาดกราฟและควบคุม UI
├── src/
│   ├── s7client.js             # โมดูลเชื่อมต่อ Siemens S7 Protocol (nodes7)
│   └── simulator.js            # FOPDT Process Simulator สำรอง
├── server.js                   # Node.js Main Server (Express + WebSocket Server)
├── deploy-lenovo-amd64.sh       # สคริปต์ 1-Click Installer สำหรับ Lenovo ThinkCentre
├── setup-247-stability.sh      # สคริปต์ตั้งค่าความเสถียร 24/7 และ Kernel Blanking
├── kiosk-watchdog.sh           # Daemon ตรวจสอบสถานะและฟื้นฟูระบบอัตโนมัติ
├── usb-mount-helper.sh         # สคริปต์เมานต์ USB Flash Drive สำหรับบันทึก Log
├── pid-app.service             # Systemd Service สำหรับ Backend
├── kiosk.service               # Systemd Service สำหรับ X11 Kiosk UI
└── package.json                # ข้อมูล Dependencies (express, ws, nodes7)
```

---

## 👨‍💻 ผู้พัฒนา (Author)

* **Author:** Dream Piyapong (**xFreedom777**)
* **Email:** [xDev.0777@gmail.com](mailto:xDev.0777@gmail.com)
* **Plant:** Mitr Phol Pin Mill Plant
* **Version:** 7.0 (Production Release for AMD64 IPC)
