# คู่มือการติดตั้งระบบบน Lenovo ThinkCentre Tiny (AMD64)
**SIMATIC S7-1200 PID Tuning Application — Mitr Phol Pin Mill Plant**

---

### 1. การเตรียมเครื่อง Lenovo ThinkCentre:
1. ติดตั้ง **Debian 12 (Bookworm) 64-bit** หรือ **Ubuntu 22.04 / 24.04 LTS Desktop**
2. ตั้ง IP Address ของการ์ด LAN ให้ตรงกับวงของ PLC S7-1200 (เช่น `192.168.x.x`)

---

### 2. ขั้นตอนการติดตั้ง (1-Click Deployment):
1. นำโฟลเดอร์ `MITRPHOL-AMD64` ใส่ Flash Drive แล้วก๊อปปี้ไปวางไว้ที่เครื่อง Lenovo (เช่น ที่ Desktop หรือ Home)
2. เปิด Terminal แล้วเข้าไปในโฟลเดอร์:
   ```bash
   cd MITRPHOL-AMD64
   ```
3. รันสคริปต์ติดตั้งอัตโนมัติ:
   ```bash
   sudo bash deploy-lenovo-amd64.sh
   ```
4. เมื่อสคริปต์ทำงานเสร็จ ให้ Reboot เครื่อง 1 ครั้ง:
   ```bash
   sudo reboot
   ```

---

### 3. ผลลัพธ์หลังเปิดเครื่อง:
* เครื่องจะบูตเข้าสู่หน้า **PID Tuning Application (Kiosk Fullscreen)** อัตโนมัติทันที
* ระบบจะเชื่อมต่อไปยัง PLC S7-1200 และเริ่มอ่าน/เขียนค่า PID ทันที
* ไม่ติดปัญหาแรมเต็ม ไม่ติดปัญหาจอดำ และรองรับการเสียบ Flash Drive เพื่อดึง Log ข้อมูลได้เหมือนเดิม
