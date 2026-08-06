require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const run = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'amc_teleconference',
    multipleStatements: true,
  });

  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'migrations', '006_conference_timeout.sql'),
      'utf8'
    );
    await connection.query(sql);
    console.log('Migration 006_conference_timeout completed successfully.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME' || err.message?.includes('Duplicate column')) {
      console.log('Timeout columns already exist — skipping.');
    } else {
      throw err;
    }
  } finally {
    await connection.end();
  }
};

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
