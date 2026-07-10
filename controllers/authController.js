const pool = require('../config/db');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
  const { username, email, password, phone } = req.body;

  try {
    // 1. Validation: ชื่อห้ามมีตัวเลข
    if (/\d/.test(username)) {
      return res.status(400).json({ 
        status: 'error', 
        errors: { username: 'ชื่อผู้ใช้งานไม่อนุญาตให้ใส่ตัวเลข' } 
      });
    }

    // 2. Validation: เบอร์โทรต้องเป็นตัวเลข 10 หลัก
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ 
        status: 'error', 
        errors: { phone: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น' } 
      });
    }

    // 3. เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. บันทึกลง Database
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, phone) VALUES ($1, $2, $3, $4) RETURNING id, username, email',
      [username, email, hashedPassword, phone]
    );

    res.status(201).json({ status: 'success', data: result.rows[0] });

  } catch (err) {
    if (err.code === '23505') { // กรณี Email หรือ Username ซ้ำ
      return res.status(400).json({ status: 'error', message: 'อีเมลหรือชื่อผู้ใช้นี้ถูกใช้งานแล้ว' });
    }
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. ค้นหาผู้ใช้ด้วย Email
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const user = userResult.rows[0];

    // 2. ตรวจสอบรหัสผ่าน (เทียบรหัสที่กรอกมากับค่า Hash ใน DB)
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    // 3. สร้าง JWT Token (กุญแจยืนยันตัวตน)
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' } // อายุการใช้งาน 1 วัน
    );

    // 4. ส่ง Token กลับไปให้ Frontend
    // ในโปรเจกต์จริงเราจะส่งผ่าน Cookie แบบ HttpOnly เพื่อความปลอดภัย (ตามบรีฟ)
    res.cookie('token', token, { 
        httpOnly: true, 
        secure: false, // เปลี่ยนเป็น true ถ้าใช้ https
        maxAge: 24 * 60 * 60 * 1000 // 1 วัน
    });

    res.json({
      status: 'success',
      message: 'เข้าสู่ระบบสำเร็จ',
      data: {
        user: { id: user.id, username: user.username, role: user.role },
        token: token // ส่ง Token กลับไปให้ Frontend เก็บไว้ใช้ยิง API อื่นๆ
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};