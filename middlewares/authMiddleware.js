const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
  let token;

  // 1. เช็กว่ามีการส่ง Token มาใน Header หรือไม่
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    // หรือเช็กจาก Cookie ตามที่ Frontend รีเควสมา
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'คุณไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบ' });
  }

  try {
    // 2. ยืนยันความถูกต้องของ Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // เก็บข้อมูล user ไว้ใน request เพื่อใช้ใน function ถัดไป
    next();
  } catch (err) {
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