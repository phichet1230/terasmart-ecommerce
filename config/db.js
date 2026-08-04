const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = {
  ...(process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      }),
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  min: 0,                                             // min=0 เพื่อไม่ให้ค้าง Stale Socket ใน Cloud Pool
  idleTimeoutMillis: 10000,                           // คืน Connection หลังจาก 10 วินาทีที่ไม่ใช้งาน
  connectionTimeoutMillis: 15000,                     // ขยายเวลาคอยการเชื่อมต่อเป็น 15 วินาที สำหรับ Cloud DB Cold Start
  statement_timeout: 30000,                           // ตั้งเวลา Timeout สำหรับ Query ที่ใช้เวลานาน 30 วินาที
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