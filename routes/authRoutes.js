const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

const os = require('os');

// Configure avatar uploads folder (สลับไปใช้ os.tmpdir() เมื่ออยู่บนระบบคลาวด์ Vercel)
const isServerless = Boolean(process.env.VERCEL || process.env.NODE_ENV === 'production');
const uploadDir = isServerless ? os.tmpdir() : path.join(__dirname, '../uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  // Ignored in read-only environments
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
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
    cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (jpg, jpeg, png, webp) เท่านั้น'));
  }
});

const { authLimiter } = require('../middlewares/rateLimitMiddleware');
const oauthController = require('../controllers/oauthController');

// Public routes with Anti Brute-Force Rate Limiting
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.get('/test-email', authController.testEmail);
router.get('/email-logs', authController.getEmailLogs);

// OAuth Redirection & Callback Routes
router.get('/google', oauthController.redirectToGoogle);
router.get('/google/callback', oauthController.handleGoogleCallback);

router.get('/line', oauthController.redirectToLine);
router.get('/line/callback', oauthController.handleLineCallback);

router.get('/facebook', oauthController.redirectToFacebook);
router.get('/facebook/callback', oauthController.handleFacebookCallback);

// Protected routes
router.put('/profile', protect, authController.updateProfile);
router.post('/request-phone-otp', protect, authController.requestPhoneOtp);
router.post('/verify-phone-otp', protect, authController.verifyPhoneOtp);
router.put('/change-password', protect, authController.changePassword);
router.put('/avatar', protect, upload.single('avatar'), authController.updateAvatar);
router.post('/logout', protect, authController.logout);

module.exports = router;