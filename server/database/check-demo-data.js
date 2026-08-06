require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'amc_teleconference',
  });
  const [cols] = await c.query("SHOW COLUMNS FROM conferences LIKE 'appointment_id'");
  const [conf] = await c.query('SELECT id, conference_code, appointment_id, scheduled_date, scheduled_time, status, gp_id, ahp_id FROM conferences');
  const [appt] = await c.query('SELECT id, appointment_code, appointment_date, appointment_time, gp_id, ahp_id, title FROM appointments');
  const [parts] = await c.query('SELECT conference_id, user_id, role_in_conference FROM conference_participants');
  console.log('appointment_id column:', cols.length ? 'yes' : 'no');
  console.log('CURDATE():', (await c.query('SELECT CURDATE() as d'))[0][0].d);
  console.log('conferences:', conf);
  console.log('appointments:', appt);
  console.log('participants:', parts);
  await c.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
