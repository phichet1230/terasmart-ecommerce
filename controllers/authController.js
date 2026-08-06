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

    // 2. Validation: เบอร์โทรต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0
    if (!/^0\d{9}$/.test(phone)) {
      return res.status(400).json({ 
        status: 'error', 
        errors: { phone: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0 เท่านั้น' },
        message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0 เท่านั้น' 
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
    if (err.code === '23505') {
      if (err.constraint === 'users_phone_key' || (err.detail && err.detail.includes('phone'))) {
        return res.status(400).json({ status: 'error', message: 'เบอร์โทรศัพท์นี้ถูกผูกเข้ากับบัญชีอื่นเรียบร้อยแล้ว (1 เบอร์โทรศัพท์สามารถเชื่อมได้เพียง 1 บัญชีเท่านั้น)' });
      }
      return res.status(400).json({ status: 'error', message: 'อีเมล เบอร์โทร หรือชื่อผู้ใช้นี้ถูกใช้งานแล้ว' });
    }
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
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

    // 2. ตรวจสอบรหัสผ่าน (หากเป็นบัญชีที่เคยสมัครผ่าน Social Login ให้ตั้งรหัสผ่านใหม่และผูกเข้าบัญชีทันที)
    if (!user.password_hash) {
      if (password && password.length >= 6) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashedPassword, user.id]);
        user.password_hash = hashedPassword;
      } else {
        return res.status(401).json({ status: 'error', message: 'กรุณาระบุรหัสผ่านอย่างน้อย 6 ตัวอักษรเพื่อผูกรหัสผ่านกับบัญชีนี้' });
      }
    } else {
      const isMatch = await bcrypt.compare(password || '', user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ status: 'error', message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
      }
    }

    // 3. สร้าง JWT Token (กุญแจยืนยันตัวตน)
    const jwtSecret = process.env.JWT_SECRET || 'tera_group_secret_key_2024';
    const token = jwt.sign(
      { id: user.id, role: user.role },
      jwtSecret,
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
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
  }
};

// 5. อัปเดตข้อมูลส่วนตัว (แก้ไขชื่อและเบอร์โทร)
exports.updateProfile = async (req, res) => {
  const user_id = req.user.id;
  const { username, phone } = req.body;

  try {
    if (username === undefined && phone === undefined) {
      return res.status(400).json({ status: 'error', message: 'No data provided' });
    }

    // ดักจับชื่อผู้ใช้งานห้ามมีตัวเลข
    if (username !== undefined && /\d/.test(username)) {
      return res.status(400).json({ 
        status: 'error', 
        errors: { username: 'ชื่อผู้ใช้งานไม่อนุญาตให้ใส่ตัวเลข' } 
      });
    }

    // ดักจับเบอร์โทรต้องเป็นตัวเลข 10 หลัก (ถ้ามีการระบุ)
    if (phone !== undefined && !/^0\d{9}$/.test(phone)) {
      return res.status(400).json({ 
        status: 'error', 
        errors: { phone: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0 เท่านั้น' },
        message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0 เท่านั้น'
      });
    }

    // ตรวจสอบชื่อซ้ำ (เฉพาะของคนอื่น)
    if (username !== undefined) {
      const checkUser = await pool.query('SELECT id FROM users WHERE username = $1 AND id <> $2', [username, user_id]);
      if (checkUser.rows.length > 0) {
        return res.status(400).json({ status: 'error', message: 'ชื่อผู้ใช้งานนี้มีผู้ใช้อื่นใช้งานแล้ว' });
      }
    }

    if (phone !== undefined) {
      const checkPhone = await pool.query('SELECT id FROM users WHERE phone = $1 AND id <> $2', [phone, user_id]);
      if (checkPhone.rows.length > 0) {
        return res.status(400).json({ status: 'error', message: 'เบอร์โทรนี้มีผู้ใช้อื่นใช้งานแล้ว' });
      }
    }

    // อัปเดตลงตาราง
    const result = await pool.query(
      `UPDATE users 
       SET username = COALESCE($1, username), phone = COALESCE($2, phone), updated_at = CURRENT_TIMESTAMP 
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
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
  }
};

// 6. เปลี่ยนรหัสผ่านขณะล็อกอิน
exports.changePassword = async (req, res) => {
  const user_id = req.user.id;
  const { old_password, new_password } = req.body;

  try {
    const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [user_id]);
    const user = userResult.rows[0];

    if (!user || !user.password_hash) {
      const hashedPassword = await bcrypt.hash(new_password, 10);
      await pool.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashedPassword, user_id]);
      return res.json({ status: 'success', message: 'ตั้งรหัสผ่านสำเร็จ' });
    }

    const isMatch = await bcrypt.compare(old_password || '', user.password_hash);
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
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
  }
};

// 7. ขอรหัสกู้คืนรหัสผ่าน (Forgot Password - Email only)
exports.forgotPassword = async (req, res) => {
  const email = req.body.email || (req.body.type === 'email' ? req.body.value : '');
  const emailNormalized = email ? email.trim().toLowerCase() : '';

  if (!emailNormalized) {
    return res.status(400).json({ status: 'error', message: 'กรุณาระบุอีเมล' });
  }

  try {
    const userResult = await pool.query('SELECT id, email FROM users WHERE email = $1', [emailNormalized]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'อีเมลดังกล่าวยังไม่ได้ทำการสมัครสมาชิก' });
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

    console.log(`🔑 Security OTP Reset generated for ${user.email}: [ ${token} ]`);

    // ส่งอีเมลจริงไปยังกล่องจดหมายแบบ Async Background (ตอบสนองใน 0.05 วินาที)
    mailer.sendRecoveryEmail(user.email, token).catch(mailErr => {
      console.error('Failed sending recovery email in background:', mailErr);
    });

    res.json({
      status: 'success',
      message: `ระบบได้ส่งรหัส OTP 6 หลักไปยังอีเมล (${user.email}) ของคุณเรียบร้อยแล้ว กรุณาตรวจสอบกล่องจดหมาย (หรือโฟลเดอร์ Spam/ขยะ)`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
  }
};

// 8. ตั้งรหัสผ่านใหม่ด้วย Token กู้คืน (Reset Password)
exports.resetPassword = async (req, res) => {
  const { email, token, new_password } = req.body;
  const emailNormalized = email ? email.trim().toLowerCase() : '';
  const tokenNormalized = token ? token.trim() : '';

  try {
    // ค้นหาและตรวจสอบโทเคน OTP (มีอายุ 15 นาที และใช้ได้ครั้งเดียวเท่านั้น)
    let resetResult;
    if (emailNormalized) {
      resetResult = await pool.query(
        `SELECT * FROM password_resets 
         WHERE email = $1 AND token = $2 AND expires_at > CURRENT_TIMESTAMP AND is_used = false 
         ORDER BY id DESC LIMIT 1`,
        [emailNormalized, tokenNormalized]
      );
    } else {
      resetResult = await pool.query(
        `SELECT * FROM password_resets 
         WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP AND is_used = false 
         ORDER BY id DESC LIMIT 1`,
        [tokenNormalized]
      );
    }

    if (resetResult.rows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'รหัส OTP กู้คืนไม่ถูกต้อง หมดอายุการใช้งาน (เกิน 15 นาที) หรือถูกใช้งานไปแล้ว' });
    }

    const resetRow = resetResult.rows[0];
    const targetEmail = resetRow.email;

    // เข้ารหัสรหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // อัปเดตรหัสผ่านใหม่ให้กับผู้ใช้งาน
    await pool.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2', [hashedPassword, targetEmail]);

    // มาร์กโทเคนว่าใช้งานแล้วทันทีเพื่อป้องกันการนำมาใช้ซ้ำ (One-Time Use Only)
    await pool.query('UPDATE password_resets SET is_used = true WHERE email = $1 OR token = $2', [targetEmail, tokenNormalized]);

    res.json({
      status: 'success',
      message: 'รีเซ็ตรหัสผ่านของคุณใหม่สำเร็จแล้ว สามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
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
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
  }
};

// 10. ออกจากระบบ (Logout)
exports.logout = async (req, res) => {
  const user_id = req.user ? req.user.id : null;

  try {
    if (user_id) {
      // ลบ Refresh Token ทั้งหมดของผู้ใช้ในฐานข้อมูลออก (Revoke)
      await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [user_id]);
    }

    // ล้างคุกกี้ Token ในเบราว์เซอร์
    res.clearCookie('token');

    res.json({
      status: 'success',
      message: 'ออกจากระบบสำเร็จ และล้างข้อมูลเซสชันเรียบร้อย'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
  }
};

// In-memory OTP Store for phone verification: key -> { userId, phone, otp, refCode, action, expiresAt }
const phoneOtpStore = new Map();

// Cleanup expired OTPs
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of phoneOtpStore.entries()) {
    if (value.expiresAt < now) {
      phoneOtpStore.delete(key);
    }
  }
}, 60000);

// 11. ขอรหัส SMS OTP เพื่อผูกเบอร์ เปลี่ยนเบอร์ หรือยกเลิกผูกเบอร์
exports.requestPhoneOtp = async (req, res) => {
  const userId = req.user.id;
  const { phone, action } = req.body; // action: 'bind' | 'change' | 'unbind'

  try {
    let targetPhone = phone ? String(phone).trim() : null;

    if (action === 'unbind') {
      // Get current user's bound phone number
      const userRes = await pool.query('SELECT phone FROM users WHERE id = $1', [userId]);
      const userObj = userRes.rows[0];
      if (!userObj || !userObj.phone) {
        return res.status(400).json({ status: 'error', message: 'บัญชีของคุณยังไม่ได้ผูกเบอร์โทรศัพท์ ไม่สามารถขอปลดล็อกได้' });
      }
      targetPhone = userObj.phone;
    } else {
      // 'bind' or 'change'
      if (!targetPhone || !/^0\d{9}$/.test(targetPhone)) {
        return res.status(400).json({ status: 'error', message: 'กรุณาระบุเบอร์โทรศัพท์ให้ถูกต้อง (10 หลัก เริ่มต้นด้วย 0)' });
      }

      // 1. Strict Uniqueness Check: 1 Phone = 1 Account
      const checkPhone = await pool.query('SELECT id FROM users WHERE phone = $1 AND id <> $2', [targetPhone, userId]);
      if (checkPhone.rows.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'เบอร์โทรศัพท์นี้ถูกผูกเข้ากับบัญชีอื่นในระบบเรียบร้อยแล้ว (1 เบอร์โทรศัพท์สามารถเชื่อมได้เพียง 1 บัญชีเท่านั้น)'
        });
      }
    }

    // Generate 6-digit OTP and 6-char Ref Code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let refCode = 'RF';
    for (let i = 0; i < 4; i++) {
      refCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    const storeKey = `${userId}:${targetPhone}:${action}`;

    phoneOtpStore.set(storeKey, {
      userId,
      phone: targetPhone,
      otp,
      refCode,
      action,
      expiresAt
    });

    console.log(`[SMS OTP System] Sent OTP to ${targetPhone} | Ref: ${refCode} | OTP: ${otp} | Action: ${action}`);

    res.json({
      status: 'success',
      message: `ส่งรหัส SMS OTP ไปยังเบอร์ ${targetPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-***-$3')} เรียบร้อยแล้ว`,
      data: {
        refCode,
        phone: targetPhone,
        expiresInSeconds: 300,
        devOtp: otp // Returned for smooth developer/user demo & testing
      }
    });
  } catch (err) {
    console.error('requestPhoneOtp Error:', err);
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
  }
};

// 12. ยืนยันรหัส SMS OTP เพื่อทำรายการผูกเบอร์ เปลี่ยนเบอร์ หรือยกเลิกผูกเบอร์
exports.verifyPhoneOtp = async (req, res) => {
  const userId = req.user.id;
  const { phone, otp, action } = req.body;

  try {
    let targetPhone = phone ? String(phone).trim() : null;

    if (action === 'unbind') {
      const userRes = await pool.query('SELECT phone FROM users WHERE id = $1', [userId]);
      const userObj = userRes.rows[0];
      if (userObj && userObj.phone) {
        targetPhone = userObj.phone;
      }
    }

    const storeKey = `${userId}:${targetPhone}:${action}`;
    const otpRecord = phoneOtpStore.get(storeKey);

    if (!otpRecord) {
      return res.status(400).json({
        status: 'error',
        message: 'ไม่พบคำขอรหัส OTP หรือรหัสหมดอายุแล้ว กรุณากดขอรหัส OTP ใหม่อีกครั้ง'
      });
    }

    if (Date.now() > otpRecord.expiresAt) {
      phoneOtpStore.delete(storeKey);
      return res.status(400).json({
        status: 'error',
        message: 'รหัส OTP หมดอายุแล้ว (เกิน 5 นาที) กรุณากดขอรหัส OTP ใหม่อีกครั้ง'
      });
    }

    if (String(otp).trim() !== otpRecord.otp) {
      return res.status(400).json({
        status: 'error',
        message: 'รหัส OTP ไม่ถูกต้อง กรุณาตรวจสอบรหัสอ้างอิงและลองใหม่อีกครั้ง'
      });
    }

    // OTP Verified! Execute action
    let updatedUser = null;
    let successMessage = '';

    if (action === 'unbind') {
      const updateRes = await pool.query(
        `UPDATE users SET phone = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, username, email, phone, role, profile_image`,
        [userId]
      );
      updatedUser = updateRes.rows[0];
      successMessage = 'ยืนยันรหัส OTP และยกเลิกการผูกเบอร์โทรศัพท์เรียบร้อยแล้ว';
    } else {
      // 'bind' or 'change'
      // Re-verify 1 Phone = 1 Account uniqueness right before updating
      const checkPhone = await pool.query('SELECT id FROM users WHERE phone = $1 AND id <> $2', [targetPhone, userId]);
      if (checkPhone.rows.length > 0) {
        phoneOtpStore.delete(storeKey);
        return res.status(400).json({
          status: 'error',
          message: 'เบอร์โทรศัพท์นี้ถูกผูกเข้ากับบัญชีอื่นในระบบเรียบร้อยแล้ว (1 เบอร์โทรศัพท์สามารถเชื่อมได้เพียง 1 บัญชีเท่านั้น)'
        });
      }

      const updateRes = await pool.query(
        `UPDATE users SET phone = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, email, phone, role, profile_image`,
        [targetPhone, userId]
      );
      updatedUser = updateRes.rows[0];
      successMessage = action === 'bind' 
        ? 'ยืนยันรหัส OTP และผูกเบอร์โทรศัพท์สำเร็จ!' 
        : 'ยืนยันรหัส OTP และเปลี่ยนเบอร์โทรศัพท์สำเร็จ!';
    }

    // Clear used OTP
    phoneOtpStore.delete(storeKey);

    res.json({
      status: 'success',
      message: successMessage,
      data: updatedUser
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({
        status: 'error',
        message: 'เบอร์โทรศัพท์นี้ถูกผูกเข้ากับบัญชีอื่นในระบบเรียบร้อยแล้ว (1 เบอร์โทรศัพท์สามารถเชื่อมได้เพียง 1 บัญชีเท่านั้น)'
      });
    }
    console.error('verifyPhoneOtp Error:', err);
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
  }
};