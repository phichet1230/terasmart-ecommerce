const { Client } = require('pg');
const path = require('path');
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  port: process.env.DB_PORT || 5432,
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to database for migration...');

    // 1. Drop NOT NULL constraint on password_hash
    console.log('Altering password_hash constraint...');
    await client.query('ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL');

    // 2. Add google_id column if not exists
    console.log('Adding google_id...');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE');

    // 3. Add line_id column if not exists
    console.log('Adding line_id...');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS line_id VARCHAR(255) UNIQUE');

    // 4. Add facebook_id column if not exists
    console.log('Adding facebook_id...');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS facebook_id VARCHAR(255) UNIQUE');

    console.log('Database migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

main();
