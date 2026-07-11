require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

pool.query(`
  CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL DEFAULT 'promptpay',
    label VARCHAR(100) DEFAULT 'PromptPay',
    promptpay_number VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  )
`).then(() => {
  console.log('payment_methods table created (or already exists)');
  pool.end();
}).catch(e => {
  console.error('Error:', e.message);
  pool.end();
});
