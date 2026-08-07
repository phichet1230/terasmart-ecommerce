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

  if (!token || token === 'undefined' || token === 'null') {
    return res.status(401).json({ status: 'error', message: 'คุณไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบ' });
  }

  try {
    // 2. ยืนยันความถูกต้องของ Token
    const jwtSecret = process.env.JWT_SECRET || 'tera_group_secret_key_2024';
    const decoded = jwt.verify(token, jwtSecret);
    
    // 3. ตรวจสอบว่าผู้ใช้ยังมีตัวตนอยู่ในระบบหรือไม่ (ค้นหาด้วย ID -> Email -> Auto Provision)
    let userResult = await pool.query('SELECT id, username, email, phone, role, account_status, profile_image FROM users WHERE id = $1', [decoded.id]);
    if (userResult.rows.length === 0 && decoded.email) {
      userResult = await pool.query('SELECT id, username, email, phone, role, account_status, profile_image FROM users WHERE email = $1', [decoded.email]);
    }
    if (userResult.rows.length === 0) {
      const fallbackUsername = (decoded.username || 'Member').replace(/[^a-zA-Z0-9_]/g, '') || ('User_' + Math.floor(1000 + Math.random() * 9000));
      const fallbackEmail = decoded.email || `${fallbackUsername.toLowerCase()}@terasmart.com`;
      const newUser = await pool.query(
        `INSERT INTO users (username, email, role, account_status)
         VALUES ($1, $2, $3, 'active')
         ON CONFLICT (email) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
         RETURNING id, username, email, phone, role, account_status, profile_image`,
        [fallbackUsername, fallbackEmail, decoded.role || 'customer']
      );
      userResult = newUser;
    }

    const user = userResult.rows[0];
    if (user.account_status !== 'active') {
      return res.status(403).json({ status: 'error', message: 'บัญชีนี้ถูกระงับการใช้งานชั่วคราว' });
    }

    req.user = user; // เก็บข้อมูล user
    next();
  } catch (err) {
    if (err.name !== 'JsonWebTokenError' && err.name !== 'TokenExpiredError') console.error('Auth middleware unexpected error:', err);
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