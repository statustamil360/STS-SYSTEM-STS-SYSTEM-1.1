require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

const run = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'amc_asterix',
  });

  try {
    const [cols] = await connection.query(
      `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments' AND COLUMN_NAME = 'comments'`
    );
    if (!cols[0].cnt) {
      console.log('appointments.comments already removed — skipping.');
      return;
    }
    await connection.query('ALTER TABLE appointments DROP COLUMN comments');
    console.log('Dropped appointments.comments');
  } finally {
    await connection.end();
  }
};

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
