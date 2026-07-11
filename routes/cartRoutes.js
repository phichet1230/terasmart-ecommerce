const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middlewares/authMiddleware'); // <--- เช็คว่ามีบรรทัดนี้แค่ที่เดียว

// ใช้ Middleware ตรวจสอบ Token สำหรับทุก Route ในไฟล์นี้
router.use(protect);

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.put('/items/:id', cartController.updateCartItem);
router.delete('/items/:id', cartController.deleteCartItem);
router.delete('/clear', cartController.clearCart);

module.exports = router;