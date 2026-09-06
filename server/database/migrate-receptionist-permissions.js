require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'amc_asterix',
  });

  try {
    const [rows] = await connection.query(
      'SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['receptionists', 'permissions'],
    );

    if (rows[0].cnt) {
      console.log('receptionists.permissions already exists — skipping.');
    } else {
      await connection.query(
        'ALTER TABLE receptionists ADD COLUMN permissions JSON NULL AFTER receptionist_code'
      );
      console.log('Added receptionists.permissions');
    }

    await connection.query(
      `INSERT INTO settings (setting_key, setting_value) VALUES ('conference_open_lead_minutes', '15')
       ON DUPLICATE KEY UPDATE setting_key = setting_key`
    );
    console.log('Seeded conference_open_lead_minutes setting (default 15)');
  } finally {
    await connection.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
