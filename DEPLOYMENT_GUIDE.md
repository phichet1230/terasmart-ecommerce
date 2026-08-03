# 🌐 คู่มือการนำระบบขึ้นใช้งานจริง (Production Deployment Guide)
## โครงงานระบบอีคอมเมิร์ซ บริษัท เทอรา กรุ้ป จำกัด (TeraSmart E-Commerce)

เอกสารฉบับนี้จัดทำขึ้นเพื่อสรุปขั้นตอนการนำระบบขึ้นใช้งานจริง (Production Infrastructure & Deployment) สำหรับทั้งฝั่ง **Backend API**, **Database (PostgreSQL)**, **Frontend (Storefront & Admin)** และการติดตั้ง **SSL Certificate (HTTPS)** กับ **Domain Name**

---

## 📋 1. การเตรียมตัวและตั้งค่า Environment Variables (`.env`)

ก่อนนำระบบขึ้นเซิร์ฟเวอร์ ให้ตรวจสอบและกำหนดค่าในไฟล์ `.env` บน Cloud Server ให้เป็นค่า Production ที่ปลอดภัย:

```env
# 1. Server & Core Config
PORT=5000
NODE_ENV=production

# 2. Production PostgreSQL Database (เช่น Amazon RDS / Supabase / ElephantSQL)
DB_USER=your_db_username
DB_PASSWORD=your_secure_db_password
DB_HOST=your_db_host.cloud.com
DB_PORT=5432
DB_NAME=terasmart_db

# 3. Security Key
JWT_SECRET=your_super_secret_jwt_key_2026_prod

# 4. SMTP Real Mailer (สำหรับการส่งอีเมลยืนยันการซื้อขายและ OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_company_email@gmail.com
SMTP_PASS=your_gmail_app_password

# 5. Merchant Test & Production Payment Account
PROMPTPAY_ID=0820761709
MERCHANT_RECEIVER_BANK=ธนาคารกรุงไทย
BANK_ACCOUNT_NO=6608200153

# 6. OAuth Production Redirect URLs
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_secret
GOOGLE_CALLBACK_URL=https://api.teragroup.com/api/v1/auth/google/callback

LINE_CLIENT_ID=your_production_line_channel_id
LINE_CLIENT_SECRET=your_production_line_secret
LINE_CALLBACK_URL=https://api.teragroup.com/api/v1/auth/line/callback
```

---

## 🗄️ 2. การตั้งค่าและสร้างฐานข้อมูล (PostgreSQL Database Setup)

1. **สร้างฐานข้อมูลบน Cloud Server**:
   ```sql
   CREATE DATABASE terasmart_db;
   ```
2. **รันไฟล์สคริปต์โครงสร้างตาราง (Migration Script)**:
   ```bash
   psql -h your_db_host.cloud.com -U your_db_username -d terasmart_db -f init.sql
   ```
3. **รันไฟล์ใส่ข้อมูลเริ่มต้น (Seed Data)**:
   ```bash
   psql -h your_db_host.cloud.com -U your_db_username -d terasmart_db -f seed.sql
   ```

---

## 🚀 3. การ Deploy Backend API (Node.js / Express)

### ตัวเลือกที่ 1: Deploy บน Render / Railway (PaaS)
1. เชื่อมต่อ GitHub Repository กับ **Render.com** หรือ **Railway.app**
2. เลือก Build Command: `npm install`
3. เลือก Start Command: `node server.js`
4. กรอกค่า Environment Variables ในหน้า Dashboard ของ Render/Railway

### ตัวเลือกที่ 2: Deploy บน Linux Cloud Server (AWS EC2 / DigitalOcean / NGINX)
1. **ติดตั้ง Node.js และ PM2 (Process Manager)**:
   ```bash
   sudo apt update && sudo apt install -y nodejs npm
   sudo npm install -y pm2 -g
   ```
2. **Clone โค้ดและติดตั้ง Dependencies**:
   ```bash
   git clone https://github.com/bdteragroup-max/ecommerce-project.git
   cd ecommerce-project
   npm install
   npm run build
   ```
3. **สั่งรันเซิร์ฟเวอร์ด้วย PM2 (ทำงานตลอด 24 ชั่วโมง)**:
   ```bash
   pm2 start server.js --name "terasmart-backend"
   pm2 save
   pm2 startup
   ```

---

## 💻 4. การ Deploy ฝั่ง Frontend (Customer Storefront & Admin)

1. **สร้างไฟล์มัดรวม Production Bundle**:
   ```bash
   npm run build
   ```
   *ไฟล์ทั้งหมดจะถูก Bundle ไว้ในโฟลเดอร์ `dist/`*

2. **นำขึ้น Web Hosting / CDN (Vercel / Netlify / NGINX)**:
   - **Vercel / Netlify**: ลากโฟลเดอร์ `dist/` วาง หรือเชื่อมต่อกับ Git Repository
   - **NGINX Web Server**: คัดลอกไฟล์ใน `dist/` ไปไว้ที่ `/var/www/html/`

---

## 🔒 5. การจดโดเมนเนมและการติดตั้ง SSL Certificate (HTTPS)

เพื่อความปลอดภัยตามมาตรฐานสากลและความน่าเชื่อถือของระบบชำระเงิน:

1. **การตั้งค่า DNS Domain Name ( Cloudflare / GoDaddy / Namecheap )**:
   - ชี้ A Record ของโดเมนเนม (เช่น `teragroup.com` หรือ `shop.teragroup.co.th`) ไปที่ IP Address ของ Cloud Server
   - ชี้ CNAME Record ของ API (เช่น `api.teragroup.co.th`) ไปที่ backend server
2. **การติดตั้ง SSL Certificate ฟรีด้วย Let's Encrypt (Certbot)**:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d shop.teragroup.co.th -d api.teragroup.co.th
   ```
   *Certbot จะทำการอัปเกรดการเชื่อมต่อจาก `http://` เป็น `https://` (SSL 256-bit Encryption) ให้อัตโนมัติ*

---

## ✅ Summary of Issue #8 Checklist Status

- [x] **Forgot Password**: API `/api/v1/auth/forgot-password` & `/api/v1/auth/reset-password` พร้อม UI Modal/Form
- [x] **Promo Discounts**: ตาราง `coupons`, API `/api/v1/coupons/validate` และช่องกรอกโค้ดลดราคาในหน้า Checkout
- [x] **Email Notifications**: Nodemailer SMTP ยิงอีเมลยืนยันคำสั่งซื้อเรียลไทม์
- [x] **AI Slip Processing**: EMVCo QR Code + Pattern Matching OCR สกัดข้อมูลเข้า JSON Array
- [x] **Infrastructure & Deployment**: จัดทำคู่มือและไฟล์สคริปต์การ Deploy บน Cloud Server พร้อม SSL (HTTPS) ครบถ้วน
