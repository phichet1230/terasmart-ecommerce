const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('/validate', couponController.validateCoupon);

module.exports = router;
