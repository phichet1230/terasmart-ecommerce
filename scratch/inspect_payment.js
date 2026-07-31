const pool = require('../config/db');

async function inspect() {
  try {
    const ordersRes = await pool.query(
      `SELECT o.id, o.total_price, o.created_at, o.status, p.payment_status, p.ai_verified_amount, p.ai_verified_datetime, p.slip_url, p.transaction_ref
       FROM orders o
       LEFT JOIN payments p ON o.id = p.order_id
       ORDER BY o.created_at DESC LIMIT 5`
    );
    console.log('--- LATEST 5 ORDERS & PAYMENTS ---');
    ordersRes.rows.forEach((row, i) => {
      console.log(`\nOrder #${i+1}:`);
      console.log(`  ID: ${row.id}`);
      console.log(`  Total Price: ${row.total_price} ฿`);
      console.log(`  Created At: ${row.created_at}`);
      console.log(`  Order Status: ${row.status}`);
      console.log(`  Payment Status: ${row.payment_status}`);
      console.log(`  AI Verified Amount: ${row.ai_verified_amount} ฿`);
      console.log(`  AI Verified DateTime: ${row.ai_verified_datetime}`);
      console.log(`  Slip URL: ${row.slip_url}`);
      console.log(`  Transaction Ref: ${row.transaction_ref}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

inspect();
