/* Temporary check: open a multi-GP meeting, both GPs join, both get report rows. Delete after verifying. */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./config/db');
const { generateAccessToken } = require('./utils/token');

const BASE = 'http://localhost:5000/api';

const tokenFor = async (email) => {
  const [rows] = await pool.execute(
    'SELECT u.id, u.email, r.name AS role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = ?',
    [email]
  );
  return rows.length ? generateAccessToken({ id: rows[0].id, email: rows[0].email, role: rows[0].role }) : null;
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

  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const created = await call(reception, 'POST', '/appointments', {
    patient_id: patients[0].id,
    gp_ids: gps.map((g) => g.id),
    title: 'Multi GP meeting flow',
    appointment_date: date,
    appointment_time: time,
    ahp_assignments: [{ profession: ahps[0].profession, ahp_id: ahps[0].id }],
  });
  const apptId = created.json.data?.id;
  const conferenceId = created.json.data?.conference?.id;
  console.log('appointment', apptId, 'conference', conferenceId);

  const accepted = await call(reception, 'POST', `/conferences/${conferenceId}/accept`);
  console.log('reception accept:', accepted.status, accepted.json.message || 'ok');

  for (const gp of gps) {
    const token = await tokenFor(gp.email);
    const join = await call(token, 'POST', `/conferences/${conferenceId}/join`);
    console.log(`${gp.email}: join -> ${join.status} ${join.json.message || 'ok'}`);
    const reports = await call(token, 'GET', `/conferences/${conferenceId}/reports`);
    console.log(`${gp.email}: reports -> ${reports.status}, rows: ${(reports.json.data ?? []).length}`);
  }

  const [reportRows] = await pool.execute(
    `SELECT participant_role, user_id FROM conference_participant_reports WHERE conference_id = ?`,
    [conferenceId]
  ).catch(() => [[]]);
  console.log('report rows in db:', reportRows);

  const ended = await call(reception, 'POST', `/conferences/${conferenceId}/end`);
  console.log('reception end:', ended.status, ended.json.message || 'ok');

  const [docs] = await pool.execute(
    'SELECT id, participant_name FROM conference_generated_documents WHERE conference_id = ?',
    [conferenceId]
  );
  console.log('generated documents:', docs);

  if (apptId) {
    await pool.execute('DELETE FROM conferences WHERE id = ?', [conferenceId]);
    await pool.execute('DELETE FROM appointments WHERE id = ?', [apptId]);
  }
  console.log('cleaned up');
  await pool.end();
})().catch(async (err) => {
  console.error('FAILED:', err.message);
  await pool.end();
  process.exit(1);
});
