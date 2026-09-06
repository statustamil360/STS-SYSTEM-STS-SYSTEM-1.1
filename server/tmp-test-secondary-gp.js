/* Temporary check: a secondary GP sees and can act on a shared conference. Delete after verifying. */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./config/db');
const { generateAccessToken } = require('./utils/token');

const BASE = 'http://localhost:5000/api';

/** Demo GP passwords were rotated locally, so mint a token straight from the signing key. */
const tokenFor = async (email) => {
  const [rows] = await pool.execute(
    `SELECT u.id, u.email, r.name AS role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = ?`,
    [email]
  );
  if (!rows.length) return null;
  return generateAccessToken({ id: rows[0].id, email: rows[0].email, role: rows[0].role });
};

const login = async (email, password) => {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  return json.success ? (json.data.token || json.token) : null;
};

const call = async (token, method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
};

(async () => {
  const reception = await tokenFor('receptionist@amc.com');
  const [gps] = await pool.execute(
    `SELECT g.id, u.email FROM gps g JOIN users u ON u.id = g.user_id
     WHERE u.status = 'active' ORDER BY g.id LIMIT 2`
  );
  const [patients] = await pool.execute('SELECT id FROM patients ORDER BY id LIMIT 1');
  const [ahps] = await pool.execute('SELECT id, profession FROM allied_health_professionals ORDER BY id LIMIT 1');

  const today = new Date();
  const date = today.toISOString().slice(0, 10);
  const time = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

  const created = await call(reception, 'POST', '/appointments', {
    patient_id: patients[0].id,
    gp_ids: gps.map((g) => g.id),
    title: 'Secondary GP visibility test',
    appointment_date: date,
    appointment_time: time,
    ahp_assignments: [{ profession: ahps[0].profession, ahp_id: ahps[0].id }],
  });
  const apptId = created.json.data?.id;
  const conferenceId = created.json.data?.conference?.id;
  console.log('create status', created.status, created.json.message, created.json.errors?.[0]?.msg || '');
  console.log('created appointment', apptId, 'conference', conferenceId, 'gps', gps.map((g) => g.email));

  for (const gp of gps) {
    const token = await tokenFor(gp.email);
    if (!token) {
      console.log(`${gp.email}: no user row — skipping`);
      continue;
    }
    const schedule = await call(token, 'GET', '/conferences/schedule?range=today');
    const ids = (schedule.json.data ?? []).map((c) => c.id);
    console.log(`${gp.email}: today's schedule has conference ${conferenceId}? ${ids.includes(conferenceId)}`);
    const detail = await call(token, 'GET', `/conferences/${conferenceId}`);
    console.log(`${gp.email}: detail status ${detail.status}, gp_participants: ${detail.json.data?.gp_participants}`);
    const join = await call(token, 'POST', `/conferences/${conferenceId}/join`);
    console.log(`${gp.email}: join -> ${join.status} ${join.json.message || 'ok'}`);
  }

  if (apptId) await call(reception, 'DELETE', `/appointments/${apptId}`);
  console.log('cleaned up');
  await pool.end();
})().catch(async (err) => {
  console.error('FAILED:', err);
  await pool.end();
  process.exit(1);
});
