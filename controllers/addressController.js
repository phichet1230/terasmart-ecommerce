const pool = require('../config/db');

// GET /api/v1/addresses - ดึงรายการที่อยู่ทั้งหมดของผู้ใช้
exports.getAddresses = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, id ASC',
      [req.user.id]
    );
    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// POST /api/v1/addresses - เพิ่มที่อยู่ใหม่
exports.addAddress = async (req, res) => {
  const { receiver_name, phone, address_detail, sub_district, district, province, postal_code, is_default } = req.body;

  if (!receiver_name || !phone || !address_detail || !sub_district || !district || !province || !postal_code) {
    return res.status(400).json({ status: 'error', message: 'กรุณากรอกข้อมูลที่อยู่ให้ครบถ้วน' });
  }
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ status: 'error', message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก' });
  }

  try {
    // หากตั้งเป็น default ให้ unset ที่อยู่เก่าก่อน
    if (is_default) {
      await pool.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
    }

    // ถ้าเป็นที่อยู่แรก ให้บังคับเป็น default
    const existing = await pool.query('SELECT COUNT(*) FROM addresses WHERE user_id = $1', [req.user.id]);
    const forceDefault = parseInt(existing.rows[0].count) === 0 ? true : !!is_default;

    const result = await pool.query(
      `INSERT INTO addresses (user_id, receiver_name, phone, address_detail, sub_district, district, province, postal_code, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.user.id, receiver_name, phone, address_detail, sub_district, district, province, postal_code, forceDefault]
    );
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// PUT /api/v1/addresses/:id - แก้ไขที่อยู่
exports.updateAddress = async (req, res) => {
  const { id } = req.params;
  const { receiver_name, phone, address_detail, sub_district, district, province, postal_code, is_default } = req.body;

  if (!receiver_name || !phone || !address_detail || !sub_district || !district || !province || !postal_code) {
    return res.status(400).json({ status: 'error', message: 'กรุณากรอกข้อมูลที่อยู่ให้ครบถ้วน' });
  }
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ status: 'error', message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก' });
  }

  try {
    // ตรวจสอบสิทธิ์เจ้าของ
    const check = await pool.query('SELECT id FROM addresses WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบที่อยู่นี้' });
    }

    if (is_default) {
      await pool.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
    }

    const result = await pool.query(
      `UPDATE addresses SET receiver_name=$1, phone=$2, address_detail=$3, sub_district=$4, district=$5, province=$6, postal_code=$7, is_default=$8
       WHERE id=$9 AND user_id=$10 RETURNING *`,
      [receiver_name, phone, address_detail, sub_district, district, province, postal_code, !!is_default, id, req.user.id]
    );
    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// DELETE /api/v1/addresses/:id - ลบที่อยู่
exports.deleteAddress = async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query('SELECT id, is_default FROM addresses WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบที่อยู่นี้' });
    }

    await pool.query('DELETE FROM addresses WHERE id = $1', [id]);

    // หากลบที่อยู่ default ให้ตั้งค่าที่อยู่ที่เหลือเป็น default ให้อัตโนมัติ
    if (check.rows[0].is_default) {
      await pool.query(
        'UPDATE addresses SET is_default = true WHERE user_id = $1 AND id = (SELECT id FROM addresses WHERE user_id = $1 ORDER BY id ASC LIMIT 1)',
        [req.user.id]
      );
    }

    res.json({ status: 'success', message: 'ลบที่อยู่สำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// PATCH /api/v1/addresses/:id/set-default - ตั้งเป็นที่อยู่เริ่มต้น
exports.setDefaultAddress = async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query('SELECT id FROM addresses WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบที่อยู่นี้' });
    }

    await pool.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
    const result = await pool.query('UPDATE addresses SET is_default = true WHERE id = $1 RETURNING *', [id]);

    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};
