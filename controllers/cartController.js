const pool = require('../config/db');

// 1. เพิ่มสินค้าลงตะกร้า
exports.addToCart = async (req, res) => {
  const { variant_id, quantity } = req.body;
  const user_id = req.user.id;

  const numQuantity = Number(quantity);
  if (!Number.isInteger(numQuantity) || numQuantity <= 0) {
    return res.status(400).json({ status: 'error', message: 'กรุณาระบุจำนวนสินค้าที่ถูกต้อง (ต้องมากกว่า 0)' });
  }

  try {
    // 1. ตรวจสอบก่อนว่า variant_id นี้มีจริงและมีสต็อกเพียงพอ
    const variantResult = await pool.query('SELECT stock_quantity, variant_name FROM product_variants WHERE id = $1', [variant_id]);
    if (variantResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบตัวเลือกสินค้าชิ้นนี้' });
    }
    const variant = variantResult.rows[0];

    if (variant.stock_quantity <= 0) {
      return res.status(400).json({ status: 'error', message: `สินค้า ${variant.variant_name} หมดชั่วคราว ไม่สามารถสั่งซื้อหรือเพิ่มลงตะกร้าได้` });
    }

    // ค้นหาว่า user คนนี้มีตะกร้าหรือยัง ถ้าไม่มีให้สร้างใหม่
    let cart = await pool.query('SELECT id FROM carts WHERE user_id = $1', [user_id]);
    
    if (cart.rows.length === 0) {
      cart = await pool.query('INSERT INTO carts (user_id) VALUES ($1) RETURNING id', [user_id]);
    }
    
    const cart_id = cart.rows[0].id;

    // เช็กว่ามีสินค้านี้ในตะกร้าอยู่แล้วไหม ถ้ามีให้บวกจำนวนเพิ่ม
    const itemExist = await pool.query(
      'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND variant_id = $2',
      [cart_id, variant_id]
    );

    let newQuantity = quantity;
    if (itemExist.rows.length > 0) {
      newQuantity = itemExist.rows[0].quantity + quantity;
      
      if (newQuantity > variant.stock_quantity) {
        return res.status(400).json({ status: 'error', message: `สินค้า ${variant.variant_name} มีในสต็อกไม่พอ (สต็อกปัจจุบัน: ${variant.stock_quantity})` });
      }

      await pool.query(
        'UPDATE cart_items SET quantity = $1 WHERE id = $2',
        [newQuantity, itemExist.rows[0].id]
      );
    } else {
      if (newQuantity > variant.stock_quantity) {
        return res.status(400).json({ status: 'error', message: `สินค้า ${variant.variant_name} มีในสต็อกไม่พอ (สต็อกปัจจุบัน: ${variant.stock_quantity})` });
      }

      await pool.query(
        'INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES ($1, $2, $3)',
        [cart_id, variant_id, quantity]
      );
    }

    res.json({ status: 'success', message: 'เพิ่มสินค้าลงตะกร้าเรียบร้อย' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
  }
};

// 2. ดูสินค้าในตะกร้า
exports.getCart = async (req, res) => {
  try {
    const cart = await pool.query(`
      SELECT ci.id as cart_item_id, ci.variant_id, p.id as product_id, p.name, p.slug, p.image_url, v.variant_name, v.price, ci.quantity, v.stock_quantity 
      FROM cart_items ci
      JOIN product_variants v ON ci.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      JOIN carts c ON ci.cart_id = c.id
      WHERE c.user_id = $1
      ORDER BY ci.id ASC
    `, [req.user.id]);

    res.json({ status: 'success', data: cart.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
  }
};

// 3. อัปเดตจำนวนสินค้าในตะกร้า
exports.updateCartItem = async (req, res) => {
  const { id } = req.params; // cart_item_id
  const { quantity } = req.body;
  const user_id = req.user.id;

  const numQuantity = Number(quantity);
  if (!Number.isInteger(numQuantity) || numQuantity <= 0) {
    return res.status(400).json({ status: 'error', message: 'กรุณาระบุจำนวนสินค้าที่ถูกต้อง (ต้องมากกว่า 0)' });
  }

  try {
    // ตรวจสอบว่าสินค้าในตะกร้านี้เป็นของผู้ใช้คนนี้จริง
    const itemCheck = await pool.query(`
      SELECT ci.id, ci.variant_id, v.stock_quantity, v.variant_name 
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      JOIN product_variants v ON ci.variant_id = v.id
      WHERE ci.id = $1 AND c.user_id = $2
    `, [id, user_id]);

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบสินค้านี้ในตะกร้าของคุณ' });
    }

    const item = itemCheck.rows[0];

    if (quantity > item.stock_quantity) {
      return res.status(400).json({ status: 'error', message: `สินค้า ${item.variant_name} ในสต็อกมีไม่เพียงพอ (สต็อกคงเหลือ: ${item.stock_quantity})` });
    }

    await pool.query('UPDATE cart_items SET quantity = $1 WHERE id = $2', [quantity, id]);
    res.json({ status: 'success', message: 'อัปเดตจำนวนสินค้าสำเร็จ' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
  }
};

// 4. ลบสินค้าออกจากตะกร้า
exports.deleteCartItem = async (req, res) => {
  const { id } = req.params; // cart_item_id
  const user_id = req.user.id;

  try {
    const itemCheck = await pool.query(`
      SELECT ci.id FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      WHERE ci.id = $1 AND c.user_id = $2
    `, [id, user_id]);

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบสินค้านี้ในตะกร้าของคุณ' });
    }

    await pool.query('DELETE FROM cart_items WHERE id = $1', [id]);
    res.json({ status: 'success', message: 'ลบสินค้าออกจากตะกร้าสำเร็จ' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
  }
};

// 5. ล้างตะกร้าทั้งหมด
exports.clearCart = async (req, res) => {
  const user_id = req.user.id;
  try {
    const cart = await pool.query('SELECT id FROM carts WHERE user_id = $1', [user_id]);
    if (cart.rows.length > 0) {
      await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.rows[0].id]);
    }
    res.json({ status: 'success', message: 'ล้างตะกร้าสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
  }
};