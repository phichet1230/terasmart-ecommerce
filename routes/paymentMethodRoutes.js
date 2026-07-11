const express = require('express');
const router = express.Router();
const paymentMethodController = require('../controllers/paymentMethodController');
const { protect } = require('../middlewares/authMiddleware');

// Public QR endpoint (ไม่ต้อง login เพื่อให้ guest checkout ใช้ได้ด้วย)
router.get('/promptpay-qr', paymentMethodController.getPromptPayQR);

// Protected routes
router.use(protect);

router.get('/', paymentMethodController.getPaymentMethods);
router.post('/', paymentMethodController.addPaymentMethod);
router.delete('/:id', paymentMethodController.deletePaymentMethod);
router.patch('/:id/set-default', paymentMethodController.setDefaultPaymentMethod);

module.exports = router;
