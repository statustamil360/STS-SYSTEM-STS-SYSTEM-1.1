require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const run = async () => {
  const conn = await pool.getConnection();
  try {
    const sqlPath = path.join(__dirname, 'migrations', '007_conference_clinical_reports.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await conn.query(statement);
        console.log('OK:', statement.slice(0, 60).replace(/\s+/g, ' '), '...');
      } catch (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_FIELDNAME') {
          console.log('Skip (exists):', statement.slice(0, 50));
        } else {
          throw err;
        }
      }
    }

    const [roles] = await conn.query("SELECT id FROM roles WHERE name = 'conference_guest'");
    if (!roles.length) {
      await conn.query(
        "INSERT INTO roles (name, description) VALUES ('conference_guest', 'Temporary guest access for external conference participants')"
      );
      console.log('Added conference_guest role');
    }

    const [endedCol] = await conn.query(
      "SHOW COLUMNS FROM conferences LIKE 'ended_at'"
    );
    if (!endedCol.length) {
      await conn.query('ALTER TABLE conferences ADD COLUMN ended_at TIMESTAMP NULL');
      console.log('Added conferences.ended_at');
    }

    const [tempPassCol] = await conn.query(
      "SHOW COLUMNS FROM conference_guest_access LIKE 'temp_password'"
    );
    if (!tempPassCol.length) {
      await conn.query(
        'ALTER TABLE conference_guest_access ADD COLUMN temp_password VARCHAR(64) NULL AFTER temp_password_hash'
      );
      console.log('Added conference_guest_access.temp_password');
    }

    console.log('Clinical reports migration complete');
  } finally {
    conn.release();
    await pool.end();
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
