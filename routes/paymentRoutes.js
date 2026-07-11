const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// ตรวจสอบและสร้างโฟลเดอร์ uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'slip-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('รองรับเฉพาะไฟล์รูปภาพเท่านั้น (jpg, jpeg, png, webp)'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Webhook ของธนาคารไม่ต้องผ่าน Auth protect เพราะถูกเรียกภายนอกจากระบบธนาคาร
router.post('/webhook', paymentController.paymentsWebhook);

router.use(protect);

router.post('/:orderId/qr', paymentController.generateQR);
router.post('/:orderId/upload', upload.single('slip'), paymentController.uploadSlip);
router.post('/:orderId/simulate-webhook', paymentController.simulateWebhook);

module.exports = router;
