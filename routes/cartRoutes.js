const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middlewares/authMiddleware'); // <--- เช็คว่ามีบรรทัดนี้แค่ที่เดียว

// ใช้ Middleware ตรวจสอบ Token สำหรับทุก Route ในไฟล์นี้
router.use(protect);

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);

module.exports = router;