# 🛡️ Siemens SIMATIC IOT2050 Power-Cut Proof & Stability Guide
**Project:** Gate Valve Control & Monitoring System — Mitr Phol Pin Mill Plant  
**Author:** Dream Piyapong (xFreedom777)  
**Version:** V6.5 Final Production (Rock-Solid 24/7)

---

## 🌟 สรุปภาพรวมสถาปัตยกรรมกันไฟดับ 100% (Power-Cut Immune)

ระบบได้รับการอัปเกรดเพื่อป้องกันปัญหา **"User สับเบรกเกอร์ดับไฟ / ไฟดับกระชาก ➔ OS พัง / SD Card Corrupted"** ได้อย่างสมบูรณ์ 100%:

### 1. ระบบ OverlayFS (Read-Only Root Filesystem)
* พาร์ติชันระบบ (`/dev/mmcblk0p1`) บน MicroSD Card ถูกเมาท์เป็น **Read-Only (อ่านอย่างเดียว 100%)**
* ข้อมูลชั่วคราว, Cache, Log ทั้งหมด และการทำงานของ Chromium Browser ถูกเปลี่ยนเส้นทางไปเขียนใน **RAM (`tmpfs`)**
* **ผลลัพธ์:** เมื่อไฟดับสด ๆ หัวอ่านจะไม่ค้างเขียนบนชิป NAND Flash ทำให้ MicroSD Card ปลอดภัย 100%

### 2. ระบบซิงก์เวลาอัตโนมัติจาก S7-1200 DB120 (0-Baht Offline RTC)
* S7-1200 ในตู้ควบคุมมีนาฬิกา Hardware RTC ความแม่นยำสูง
* ตัวโปรแกรมใน `server.js` จะอ่านค่า DTL จาก **DB120 Offset 0.0** ทุกๆ 5 วินาทีในลูป Poller
* **ผลลัพธ์:** เมื่อ IOT2050 บูตขึ้นมา เวลาจะถูกปรับให้ตรงกับ PLC อัตโนมัติทันที ไม่ต้องใส่ถ่าน CR2032 และไม่ต้องต่ออินเทอร์เน็ต

### 3. ระบบจัดการ RAM Memory Guard (1GB RAM Protection)
* จำกัดไฟล์ Log ใน RAM (`tmpfs`) ไว้สูงสุดที่ **7 วัน** เพื่อป้องกันไม่ให้หน่วยความจำ 1GB เต็ม
* ข้อมูลระยะยาว (1 เดือน, 1 ปี) จะถูกสำรองและสะสมถาวรบน **USB Flash Drive (FAT32)** อัตโนมัติทุกเที่ยงคืน

### 4. ระบบ Backend S7 Auto-Reconnect Daemon
* `server.js` มี Background Loop คอยพยายามเชื่อมต่อ S7-1200 ใหม่อัตโนมัติทุกๆ 10 วินาที
* หากตู้ไฟ PLC ถูกปิดเปิดใหม่ หรือสาย LAN ถูกถอดเสียบใหม่ ตัวแอปจะต่อกลับเองทันทีโดยไม่ต้องแตะหน้าจอ

---

## 🛠️ คำสั่งดูแลรักษาระบบ (Maintenance Commands)

| คำสั่ง | หน้าที่การทำงาน |
| :--- | :--- |
| `df -h /` | ตรวจสอบสถานะเกราะกันไฟดับ (ต้องขึ้น `overlayroot`) |
| `sudo edit-system` | เข้าสู่โหมด **Write Mode (chroot)** เพื่อแก้ไฟล์ถาวรบน SD Card (พิมพ์ `exit` เมื่อเสร็จ) |
| `sudo disable-readonly` | ปิดระบบ Read-Only ชั่วคราว (ต้อง reboot) |
| `sudo enable-readonly` | เปิดระบบ Read-Only กลับคืนมา (ต้อง reboot) |

---

## 🚀 ขั้นตอนการ Deploy แพตช์

1. เชื่อมต่อสาย LAN เข้ากับวงเครือข่ายของ IOT2050
2. เปิด PowerShell ในโฟลเดอร์นี้ แล้วรัน:
   ```powershell
   .\Deploy-Patch.ps1
   ```
3. กด `Y` เพื่อ Reboot บอร์ด IOT2050
4. ระบบจะพร้อมทำงาน 24/7 อย่างสมบูรณ์แบบ!
