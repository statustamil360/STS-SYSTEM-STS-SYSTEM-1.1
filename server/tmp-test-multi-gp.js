/* Temporary end-to-end check for multi-GP appointments. Delete after verifying. */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./config/db');

const BASE = 'http://localhost:5000/api';

const login = async (email, password = 'Admin@123') => {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(`login ${email} failed: ${json.message}`);
  return json.data.token || json.token || json.data.accessToken;
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
  const token = await login('receptionist@amc.com');

  const [gps] = await pool.execute('SELECT id FROM gps ORDER BY id LIMIT 3');
  const [patients] = await pool.execute('SELECT id FROM patients ORDER BY id LIMIT 1');
  const [ahps] = await pool.execute('SELECT id, profession FROM allied_health_professionals ORDER BY id LIMIT 1');
  console.log('gps:', gps.map((g) => g.id), 'patient:', patients[0]?.id);

  const gpIds = gps.slice(0, 2).map((g) => g.id);
  const date = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);

  const created = await call(token, 'POST', '/appointments', {
    patient_id: patients[0].id,
    gp_ids: gpIds,
    title: 'Multi GP test',
    appointment_date: date,
    appointment_time: '11:30',
    ahp_assignments: [{ profession: ahps[0].profession, ahp_id: ahps[0].id }],
  });
  console.log('create:', created.status, created.json.message);
  const apptId = created.json.data?.id;
  console.log('gp_ids returned:', created.json.data?.gp_ids, '| gp_summary:', created.json.data?.gp_summary);

  const [rows] = await pool.execute('SELECT gp_id FROM appointment_gps WHERE appointment_id = ?', [apptId]);
  console.log('appointment_gps rows:', rows.map((r) => r.gp_id));

  const [parts] = await pool.execute(
    `SELECT cp.role_in_conference, cp.user_id FROM conference_participants cp
     JOIN conferences c ON c.id = cp.conference_id WHERE c.appointment_id = ?`,
    [apptId]
  );
  console.log('conference participants:', parts);

  // Reduce to a single GP, then widen to three
  const updated = await call(token, 'PUT', `/appointments/${apptId}`, { gp_ids: [gps[gps.length - 1].id] });
  console.log('update to 1 gp:', updated.status, updated.json.message);
  const [rows2] = await pool.execute('SELECT gp_id FROM appointment_gps WHERE appointment_id = ?', [apptId]);
  const [appt2] = await pool.execute('SELECT gp_id FROM appointments WHERE id = ?', [apptId]);
  console.log('after update rows:', rows2.map((r) => r.gp_id), '| appointments.gp_id:', appt2[0].gp_id);
  const [parts2] = await pool.execute(
    `SELECT cp.role_in_conference, cp.user_id FROM conference_participants cp
     JOIN conferences c ON c.id = cp.conference_id WHERE c.appointment_id = ?`,
    [apptId]
  );
  console.log('participants after update:', parts2);

  const empty = await call(token, 'POST', '/appointments', {
    patient_id: patients[0].id,
    gp_ids: [],
    title: 'No GP test',
    appointment_date: date,
    appointment_time: '12:30',
    ahp_assignments: [{ profession: ahps[0].profession, ahp_id: ahps[0].id }],
  });
  console.log('create without gp:', empty.status, empty.json.errors?.[0]?.msg || empty.json.message);

  const legacy = await call(token, 'POST', '/appointments', {
    patient_id: patients[0].id,
    gp_id: gps[0].id,
    title: 'Legacy single GP',
    appointment_date: date,
    appointment_time: '13:30',
    ahp_assignments: [{ profession: ahps[0].profession, ahp_id: ahps[0].id }],
  });
  console.log('legacy gp_id create:', legacy.status, legacy.json.data?.gp_ids);

  const list = await call(token, 'GET', '/appointments?limit=3');
  console.log('list gp_summary sample:', list.json.data?.map((r) => r.gp_summary));

  // Second GP must see the conference in their schedule
  const [gpUser] = await pool.execute(
    'SELECT u.email FROM gps g JOIN users u ON u.id = g.user_id WHERE g.id = ?',
    [gpIds[1]]
  );
  console.log('second gp user:', gpUser[0]?.email);

  // clean up test rows
  for (const id of [apptId, legacy.json.data?.id]) {
    if (id) await call(token, 'DELETE', `/appointments/${id}`);
  }
  console.log('cleaned up');
  await pool.end();
})().catch(async (err) => {
  console.error('FAILED:', err);
  await pool.end();
  process.exit(1);
});
