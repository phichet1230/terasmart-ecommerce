const pool = require('c:/Users/WIN11/Downloads/terasmartecom-backend/config/db');

async function checkCart() {
  try {
    const userRes = await pool.query("SELECT id FROM users WHERE email = 'customer@terasmart.com'");
    if (userRes.rows.length === 0) {
      console.log("Customer user not found.");
      return;
    }
    const userId = userRes.rows[0].id;
    console.log("Customer User ID:", userId);

    const cartRes = await pool.query(`
      SELECT ci.id as cart_item_id, ci.variant_id, p.id as product_id, p.name, p.slug, v.variant_name, v.price, ci.quantity, v.stock_quantity 
      FROM cart_items ci
      JOIN product_variants v ON ci.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      JOIN carts c ON ci.cart_id = c.id
      WHERE c.user_id = $1
      ORDER BY ci.id ASC
    `, [userId]);

    console.log("Cart Items count:", cartRes.rows.length);
    if (cartRes.rows.length > 0) {
      console.log("First item fields:", Object.keys(cartRes.rows[0]));
      console.log("First item sample:", cartRes.rows[0]);
    } else {
      console.log("No items in customer's cart.");
    }
  } catch (err) {
    console.error("Error checking cart:", err);
  } finally {
    pool.end();
  }
}

checkCart();
