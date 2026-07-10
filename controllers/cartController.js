const pool = require('../config/db');

// 1. เพิ่มสินค้าลงตะกร้า
exports.addToCart = async (req, res) => {
  const { variant_id, quantity } = req.body;
  const user_id = req.user.id;

  try {
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

    if (itemExist.rows.length > 0) {
      await pool.query(
        'UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2',
        [quantity, itemExist.rows[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES ($1, $2, $3)',
        [cart_id, variant_id, quantity]
      );
    }

    res.json({ status: 'success', message: 'เพิ่มสินค้าลงตะกร้าเรียบร้อย' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// 2. ดูสินค้าในตะกร้า
exports.getCart = async (req, res) => {
  try {
    const cart = await pool.query(`
      SELECT ci.id, p.name, v.variant_name, v.price, ci.quantity 
      FROM cart_items ci
      JOIN product_variants v ON ci.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      JOIN carts c ON ci.cart_id = c.id
      WHERE c.user_id = $1
    `, [req.user.id]);

    res.json({ status: 'success', data: cart.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};