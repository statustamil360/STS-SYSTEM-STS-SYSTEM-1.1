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
    await connection.query(
      `CREATE TABLE IF NOT EXISTS appointment_gps (
        id INT PRIMARY KEY AUTO_INCREMENT,
        appointment_id INT NOT NULL,
        gp_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
        FOREIGN KEY (gp_id) REFERENCES gps(id) ON DELETE CASCADE,
        UNIQUE KEY unique_appointment_gp (appointment_id, gp_id)
      )`
    );
    console.log('appointment_gps table ready');

    const [indexes] = await connection.query(
      `SELECT COUNT(*) AS cnt FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointment_gps' AND INDEX_NAME = 'idx_appointment_gps_appointment'`
    );
    if (!indexes[0].cnt) {
      await connection.query('CREATE INDEX idx_appointment_gps_appointment ON appointment_gps(appointment_id)');
      console.log('Added idx_appointment_gps_appointment');
    }

    const [result] = await connection.query(
      `INSERT IGNORE INTO appointment_gps (appointment_id, gp_id)
       SELECT id, gp_id FROM appointments WHERE gp_id IS NOT NULL`
    );
    console.log(`Backfilled ${result.affectedRows} existing GP assignment(s)`);
  } finally {
    await connection.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
