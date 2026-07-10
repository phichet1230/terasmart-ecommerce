const express = require('express');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json()); // อ่าน JSON จาก Body ได้
app.use(cookieParser()); // อ่าน Cookie ได้

// Routes (เดี๋ยวเราจะมาเพิ่มตรงนี้)
app.get('/', (req, res) => {
  res.send('TeraSmart API is running...');
});

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