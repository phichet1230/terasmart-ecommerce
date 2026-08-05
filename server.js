const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(compression()); // Gzip response compression for ultra-fast load times under high concurrency

// Security & CORS Middleware for Multi-Device, Tunnel & International Security Compliance
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache OPTIONS preflight request for 24 hours in browser
  
  // Enterprise Security Headers (OWASP Standards)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const fs = require('fs');
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
}

// Static File Caching Options (Browser Storage Optimization)
const staticOptions = {
  maxAge: '7d',         // ให้เบราว์เซอร์ลูกค้าจำไฟล์รูปภาพ/JS/CSS ไว้ 7 วัน ไม่ต้องดาวน์โหลดซ้ำ
  etag: true,
  lastModified: true
};

// Middleware
app.use(express.json({ limit: '50mb' })); // อ่าน JSON จาก Body ได้สูงสุด 50MB (รองรับรูปภาพ Banner/สินค้าขนาดใหญ่)
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser()); // อ่าน Cookie ได้
app.use(express.static(path.join(__dirname, 'dist'), staticOptions)); // ให้บริการไฟล์ HTML/CSS/JS หน้าบ้านที่คอมไพล์แล้ว
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), staticOptions)); // ให้บริการไฟล์รูปภาพและสลิปชำระเงิน

const autoMigrate = require('./utils/autoMigrate');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await autoMigrate();
  } catch (e) {
    console.warn('Startup migration notice:', e.message);
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server started on http://0.0.0.0:${PORT}`);
  });
})();

const authRoutes = require('./routes/authRoutes');
app.use('/api/v1/auth', authRoutes);

const productRoutes = require('./routes/productRoutes');
app.use('/api/v1/products', productRoutes);

const cartRoutes = require('./routes/cartRoutes');
app.use('/api/v1/cart', cartRoutes);

const addressRoutes = require('./routes/addressRoutes');
app.use('/api/v1/addresses', addressRoutes);

const orderRoutes = require('./routes/orderRoutes');
app.use('/api/v1/orders', orderRoutes);

const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/v1/payments', paymentRoutes);

const categoryRoutes = require('./routes/categoryRoutes');
app.use('/api/v1/categories', categoryRoutes);

const couponRoutes = require('./routes/couponRoutes');
app.use('/api/v1/coupons', couponRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/api/v1/admin', adminRoutes);

const bannerRoutes = require('./routes/bannerRoutes');
app.use('/api/v1/banners', bannerRoutes);

// Fallback for unmatched /api routes to always return JSON 404 instead of HTML
app.use('/api', (req, res) => {
  res.status(404).json({ status: 'error', message: `ไม่พบ API Endpoint (${req.originalUrl})` });
});

// Wildcard routing fallback for React Single Page Application (SPA) routing
app.get(/^\/(?!api|uploads).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});