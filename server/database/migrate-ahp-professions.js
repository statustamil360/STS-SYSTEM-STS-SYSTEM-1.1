require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'amc_teleconference',
    multipleStatements: true,
  });

  const [tables] = await connection.query("SHOW TABLES LIKE 'ahp_professions'");
  if (!tables.length) {
    const sql = fs.readFileSync(path.join(__dirname, 'migrations/002_ahp_professions.sql'), 'utf8');
    await connection.query(sql);
    console.log('Created ahp_professions table');
  }

  const defaults = [
    'Physiotherapist',
    'Occupational Therapist',
    'Speech Therapist',
    'Dietitian',
    'Psychologist',
    'Social Worker',
  ];
  for (const name of defaults) {
    await connection.query('INSERT IGNORE INTO ahp_professions (name) VALUES (?)', [name]);
  }

  console.log('AHP professions ready');
  await connection.end();
}

migrate().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
