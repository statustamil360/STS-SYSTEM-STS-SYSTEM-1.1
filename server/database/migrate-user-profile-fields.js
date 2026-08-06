require('dotenv').config();
const mysql = require('mysql2/promise');

const COLUMNS = [
  { name: 'date_of_birth', sql: 'ADD COLUMN date_of_birth DATE NULL AFTER phone' },
  { name: 'gender', sql: "ADD COLUMN gender ENUM('male', 'female', 'other') NULL AFTER date_of_birth" },
  { name: 'nic', sql: 'ADD COLUMN nic VARCHAR(50) NULL AFTER gender' },
  { name: 'emergency_contact', sql: 'ADD COLUMN emergency_contact VARCHAR(100) NULL AFTER address' },
];

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'amc_teleconference',
  });

  for (const col of COLUMNS) {
    const [rows] = await connection.query(
      'SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['user_profiles', col.name],
    );
    if (!rows[0].cnt) {
      await connection.query(`ALTER TABLE user_profiles ${col.sql}`);
      console.log(`Added user_profiles.${col.name}`);
    }
  }

  console.log('User profile extended fields ready');
  await connection.end();
}

migrate().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
