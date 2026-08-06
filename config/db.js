const { Pool } = require('pg');
require('dotenv').config();

const defaultCloudDbUrl = 'postgresql://terasmart_user:vk3eDqqqYtIrDcSL4cKbv4YTUXm0UCbf@dpg-d9olodbm8hqs739buu9g-a.singapore-postgres.render.com/terasmart_db';
const activeDbUrl = process.env.DATABASE_URL || (process.env.NODE_ENV === 'production' || process.env.VERCEL ? defaultCloudDbUrl : null);

const poolConfig = {
  ...(activeDbUrl
    ? {
        connectionString: activeDbUrl,
        ssl: { rejectUnauthorized: false }
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      }),
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  min: 2,                                             // รักษาสายเชื่อมต่อสำรองอย่างน้อย 2 connections เพื่อลด Reconnect Latency
  idleTimeoutMillis: 30000,                           // คืน Connection หลังจาก 30 วินาทีที่ไม่ใช้งาน
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
};

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log('✅ Connected to TeraSmart Database');
});

pool.on('error', (err) => {
  console.error('⚠️ Unexpected error on idle PostgreSQL client:', err.message);
});

module.exports = pool;

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Database connected at:', res.rows[0].now);
  }
});