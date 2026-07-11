const pool = require('../config/db');
const bcrypt = require('bcrypt');
const mailer = require('../utils/mailer');

exports.register = async (req, res) => {
  const { username, email, password, phone } = req.body;
  const emailNormalized = email ? email.trim().toLowerCase() : '';

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
      [username, emailNormalized, hashedPassword, phone]
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
  const emailNormalized = email ? email.trim().toLowerCase() : '';

  try {
    // 1. ค้นหาผู้ใช้ด้วย Email
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [emailNormalized]);
    
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
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          email: user.email,
          phone: user.phone,
          profile_image: user.profile_image
        },
        token: token // ส่ง Token กลับไปให้ Frontend เก็บไว้ใช้ยิง API อื่นๆ
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// 5. อัปเดตข้อมูลส่วนตัว (แก้ไขชื่อและเบอร์โทร)
exports.updateProfile = async (req, res) => {
  const user_id = req.user.id;
  const { username, phone } = req.body;

  try {
    // ดักจับชื่อผู้ใช้งานห้ามมีตัวเลข
    if (/\d/.test(username)) {
      return res.status(400).json({ 
        status: 'error', 
        errors: { username: 'ชื่อผู้ใช้งานไม่อนุญาตให้ใส่ตัวเลข' } 
      });
    }

    // ดักจับเบอร์โทรต้องเป็นตัวเลข 10 หลัก
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ 
        status: 'error', 
        errors: { phone: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น' } 
      });
    }

    // ตรวจสอบชื่อซ้ำ (เฉพาะของคนอื่น)
    const checkUser = await pool.query('SELECT id FROM users WHERE username = $1 AND id <> $2', [username, user_id]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ status: 'error', message: 'ชื่อผู้ใช้งานนี้มีผู้ใช้อื่นใช้งานแล้ว' });
    }

    // อัปเดตลงตาราง
    const result = await pool.query(
      `UPDATE users 
       SET username = $1, phone = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING id, username, email, phone`,
      [username, phone, user_id]
    );

    res.json({
      status: 'success',
      message: 'อัปเดตโปรไฟล์สำเร็จ',
      data: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// 6. เปลี่ยนรหัสผ่านขณะล็อกอิน
exports.changePassword = async (req, res) => {
  const user_id = req.user.id;
  const { old_password, new_password } = req.body;

  try {
    const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [user_id]);
    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(old_password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ status: 'error', message: 'รหัสผ่านเดิมไม่ถูกต้อง' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashedPassword, user_id]);

    res.json({
      status: 'success',
      message: 'เปลี่ยนรหัสผ่านสำเร็จ'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// 7. ขอรหัสกู้คืนรหัสผ่าน (Forgot Password - Email only)
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const emailNormalized = email ? email.trim().toLowerCase() : '';

  if (!emailNormalized) {
    return res.status(400).json({ status: 'error', message: 'กรุณาระบุอีเมล' });
  }

  try {
    const userResult = await pool.query('SELECT id, email FROM users WHERE email = $1', [emailNormalized]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบอีเมลนี้ในระบบ' });
    }
    const user = userResult.rows[0];

    // สร้าง Token 6 หลัก สำหรับกรอกกู้คืน
    const token = 'TS-' + Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // มีอายุ 15 นาที

    // บันทึก Token ลง database
    await pool.query(
      'INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)',
      [user.email, token, expiresAt]
    );

    console.log(`🔑 Security Token Reset for ${user.email}: [ ${token} ]`);

    // ส่งอีเมลจริง
    try {
      await mailer.sendRecoveryEmail(user.email, token);
    } catch (mailErr) {
      console.error('Failed to send recovery email:', mailErr);
    }

    res.json({
      status: 'success',
      message: 'รหัสลับสำหรับรีเซ็ตถูกส่งไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบกล่องจดหมาย'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// 8. ตั้งรหัสผ่านใหม่ด้วย Token กู้คืน (Reset Password)
exports.resetPassword = async (req, res) => {
  const { email, token, new_password } = req.body;
  const emailNormalized = email ? email.trim().toLowerCase() : '';
  const tokenNormalized = token ? token.trim() : '';

  try {
    // ค้นหาและตรวจสอบโทเคน
    const resetResult = await pool.query(
      `SELECT * FROM password_resets 
       WHERE email = $1 AND token = $2 AND expires_at > CURRENT_TIMESTAMP AND is_used = false 
       ORDER BY id DESC LIMIT 1`,
      [emailNormalized, tokenNormalized]
    );

    if (resetResult.rows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'รหัสอ้างอิงกู้คืนไม่ถูกต้องหรือหมดอายุการใช้งานแล้ว' });
    }

    const resetRow = resetResult.rows[0];

    // เข้ารหัสรหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // อัปเดตรหัสผ่านใหม่ให้กับผู้ใช้งาน
    await pool.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2', [hashedPassword, emailNormalized]);

    // มาร์กโทเคนว่าใช้งานแล้ว
    await pool.query('UPDATE password_resets SET is_used = true WHERE id = $1', [resetRow.id]);

    res.json({
      status: 'success',
      message: 'รีเซ็ตรหัสผ่านของคุณใหม่สำเร็จแล้ว สามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// 9. อัปเดตและอัปโหลดรูปโปรไฟล์ (Avatar)
exports.updateAvatar = async (req, res) => {
  const user_id = req.user.id;

  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'กรุณาอัปโหลดรูปภาพโปรไฟล์' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;

    // อัปเดตลงตาราง users
    const result = await pool.query(
      'UPDATE users SET profile_image = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, email, phone, role, profile_image',
      [avatarUrl, user_id]
    );

    res.json({
      status: 'success',
      message: 'อัปโหลดรูปภาพโปรไฟล์สำเร็จ',
      data: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};