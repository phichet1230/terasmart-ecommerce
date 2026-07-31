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
  max: parseInt(process.env.DB_POOL_MAX || '50', 10), // ปรับเพิ่มความจุ Connection Pool สูงสุดเป็น 50 connections สำหรับรองรับการสั่งซื้อพร้อมกันจำนวนมาก
  min: parseInt(process.env.DB_POOL_MIN || '5', 10),  // รักษาสายเชื่อมต่อขั้นต่ำไว้ 5 connections พร้อมประมวลผลทันที
  idleTimeoutMillis: 30000,                           // เคลียร์การเชื่อมต่อที่ไม่ได้ใช้งานหลังจาก 30 วินาทีเพื่อคืน RAM ให้ระบบ
  connectionTimeoutMillis: 5000,                      // ตั้งเวลาคอยการเชื่อมต่อสูงสุด 5 วินาทีเพื่อป้องกัน Request ค้าง
  statement_timeout: 10000                            // ป้องกันการค้างของคำสั่ง SQL ที่ใช้เวลานานเกิน 10 วินาที
};

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log('✅ Connected to TeraSmart Database');
});

module.exports = pool;

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Database connected at:', res.rows[0].now);
  }
});