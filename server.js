const express = require('express');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json()); // อ่าน JSON จาก Body ได้
app.use(cookieParser()); // อ่าน Cookie ได้

// ให้บริการไฟล์ Static ในโฟลเดอร์ public (หน้าบ้าน) และ uploads (ไฟล์อัปโหลด)
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on http://localhost:${PORT}`);
});

const authRoutes = require('./routes/authRoutes');
app.use('/api/v1/auth', authRoutes);

const productRoutes = require('./routes/productRoutes');
app.use('/api/v1/products', productRoutes);

const cartRoutes = require('./routes/cartRoutes');
app.use('/api/v1/cart', cartRoutes);

const categoryRoutes = require('./routes/categoryRoutes');
app.use('/api/v1/categories', categoryRoutes);

const addressRoutes = require('./routes/addressRoutes');
app.use('/api/v1/addresses', addressRoutes);

const paymentMethodRoutes = require('./routes/paymentMethodRoutes');
app.use('/api/v1/payment-methods', paymentMethodRoutes);

const orderRoutes = require('./routes/orderRoutes');
app.use('/api/v1/orders', orderRoutes);

const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/v1/payments', paymentRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/api/v1/admin', adminRoutes);