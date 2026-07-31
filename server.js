const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();

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

// Middleware
app.use(express.json()); // อ่าน JSON จาก Body ได้
app.use(cookieParser()); // อ่าน Cookie ได้
app.use(express.static('dist')); // ให้บริการไฟล์ HTML/CSS/JS หน้าบ้านที่คอมไพล์แล้วจาก React/Vite
app.use('/uploads', express.static('uploads')); // ให้บริการไฟล์สลิปชำระเงินที่อัปโหลดเข้ามา

// Routes (เดี๋ยวเราจะมาเพิ่มตรงนี้)
app.get('/', (req, res) => {
  res.send('TeraSmart API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server started on http://0.0.0.0:${PORT}`);
});

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

// Fallback for unmatched /api routes to always return JSON 404 instead of HTML
app.use('/api', (req, res) => {
  res.status(404).json({ status: 'error', message: `ไม่พบ API Endpoint (${req.originalUrl})` });
});

// Wildcard routing fallback for React Single Page Application (SPA) routing
app.get(/^\/(?!api|uploads).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});