const jwt = require('jsonwebtoken');
const pool = require('../config/db');

exports.protect = async (req, res, next) => {
  let token;

  // 1. เช็กว่ามีการส่ง Token มาใน Header หรือไม่
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'คุณไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบ' });
  }

  try {
    // 2. ยืนยันความถูกต้องของ Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tera_group_secret_key_2024');
    
    // 3. ตรวจสอบว่าผู้ใช้ยังมีตัวตนอยู่ในระบบหรือไม่
    const userResult = await pool.query('SELECT id, username, email, phone, role, account_status, profile_image FROM users WHERE id = $1', [decoded.id]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'ไม่พบผู้ใช้ในระบบ กรุณาเข้าสู่ระบบใหม่' });
    }

    const user = userResult.rows[0];
    if (user.account_status !== 'active') {
      return res.status(403).json({ status: 'error', message: 'บัญชีนี้ถูกระงับการใช้งานชั่วคราว' });
    }

    req.user = user; // เก็บข้อมูล user
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ status: 'error', message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
};

// Middleware สำหรับเช็กว่าเป็น Admin หรือไม่
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'error', message: 'คุณไม่มีสิทธิ์ทำงานนี้ (Admin Only)' });
    }
    next();
  };
};