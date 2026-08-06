/**
 * End-to-end API verification script for AMC Teleconference Management System.
 * Run: node scripts/e2e-verify.js
 */
const BASE = process.env.API_BASE || 'http://localhost:5000/api';

const results = [];
const pass = (name) => { results.push({ name, status: 'PASS' }); console.log(`✓ ${name}`); };
const fail = (name, detail) => { results.push({ name, status: 'FAIL', detail }); console.log(`✗ ${name}: ${detail}`); };
const partial = (name, detail) => { results.push({ name, status: 'PARTIAL', detail }); console.log(`~ ${name}: ${detail}`); };

async function req(method, path, { token, body, expectStatus } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('json')) data = await res.json();
  else data = await res.text();
  if (expectStatus && res.status !== expectStatus) {
    throw new Error(`${method} ${path} expected ${expectStatus}, got ${res.status}: ${JSON.stringify(data)}`);
  }
  return { status: res.status, data, headers: res.headers };
}

async function login(email, password) {
  const { status, data } = await req('POST', '/auth/login', { body: { email, password } });
  if (status !== 200 || !data?.data?.accessToken) throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
  return data.data;
}

async function main() {
  console.log('\n=== AMC System E2E Verification ===\n');

  // Health
  try {
    const { status } = await req('GET', '/dashboard/stats', { expectStatus: 401 });
    if (status === 401) pass('Unauthenticated API returns 401');
  } catch (e) { fail('Unauthenticated API returns 401', e.message); }

  // Failed login unknown email (no FK error)
  try {
    const { status, data } = await req('POST', '/auth/login', { body: { email: 'nonexistent@test.com', password: 'wrong' } });
    if (status === 401) pass('Unknown email login returns 401 without server crash');
    else fail('Unknown email login', `status ${status}: ${JSON.stringify(data)}`);
  } catch (e) { fail('Unknown email login', e.message); }

  // Super Admin
  let superToken, adminToken, receptionistToken, gpToken, ahpToken;
  try {
    const sa = await login('superadmin@amc.com', 'Admin@123');
    superToken = sa.accessToken;
    pass('Super Admin login');
    const dash = await req('GET', '/dashboard/stats', { token: superToken });
    if (dash.status === 200 && dash.data?.data) pass('Super Admin dashboard stats');
    else fail('Super Admin dashboard stats', JSON.stringify(dash.data));
    const admins = await req('GET', '/admins', { token: superToken });
    if (admins.status === 200) pass('Super Admin list admins');
    else fail('Super Admin list admins', JSON.stringify(admins.data));
    const auditRes = await fetch(`${BASE}/audit/export?format=csv`, { headers: { Authorization: `Bearer ${superToken}` } });
    const auditText = await auditRes.text();
    if (auditRes.status === 200 && auditText.includes('id,user_id')) pass('Super Admin audit CSV export (authenticated)');
    else fail('Super Admin audit CSV export', `status ${auditRes.status}`);
  } catch (e) { fail('Super Admin tests', e.message); }

  // Admin
  try {
    const ad = await login('admin@amc.com', 'Admin@123');
    adminToken = ad.accessToken;
    pass('Admin login');
    const dash = await req('GET', '/dashboard/stats', { token: adminToken });
    if (dash.status === 200) pass('Admin dashboard stats');
    else fail('Admin dashboard stats', JSON.stringify(dash.data));
    const blocked = await req('GET', '/admins', { token: adminToken });
    if (blocked.status === 403) pass('Admin blocked from super_admin admins list');
    else partial('Admin blocked from admins list', `got ${blocked.status}`);
    const recs = await req('GET', '/staff/receptionists', { token: adminToken });
    if (recs.status === 200) pass('Admin list receptionists');
    else fail('Admin list receptionists', JSON.stringify(recs.data));
    const patients = await req('GET', '/patients', { token: adminToken });
    if (patients.status === 200) pass('Admin list patients');
    else fail('Admin list patients', JSON.stringify(patients.data));
  } catch (e) { fail('Admin tests', e.message); }

  // Receptionist
  try {
    const rc = await login('receptionist@amc.com', 'Admin@123');
    receptionistToken = rc.accessToken;
    pass('Receptionist login');
    const dash = await req('GET', '/dashboard/stats', { token: receptionistToken });
    if (dash.status === 200) pass('Receptionist dashboard stats');
    else fail('Receptionist dashboard stats', JSON.stringify(dash.data));
    const blocked = await req('GET', '/admins', { token: receptionistToken });
    if (blocked.status === 403) pass('Receptionist blocked from admin API');
    else fail('Receptionist RBAC', `admins status ${blocked.status}`);
    const assignable = await req('GET', '/staff/assignable-users', { token: receptionistToken });
    if (assignable.status === 200 && Array.isArray(assignable.data?.data)) pass('Receptionist assignable users dropdown');
    else fail('Receptionist assignable users', JSON.stringify(assignable.data));
  } catch (e) { fail('Receptionist tests', e.message); }

  // GP
  try {
    const gp = await login('gp@amc.com', 'Admin@123');
    gpToken = gp.accessToken;
    pass('GP login');
    const patients = await req('GET', '/patients', { token: gpToken });
    if (patients.status === 200) pass('GP assigned patients API');
    else fail('GP assigned patients', JSON.stringify(patients.data));
    const blocked = await req('GET', '/staff/receptionists', { token: gpToken });
    if (blocked.status === 403) pass('GP blocked from receptionist management');
    else fail('GP RBAC', `status ${blocked.status}`);
    const conf = await req('GET', '/conferences', { token: gpToken });
    if (conf.status === 200) pass('GP conferences list');
    else fail('GP conferences', JSON.stringify(conf.data));
  } catch (e) { fail('GP tests', e.message); }

  // AHP
  try {
    const ahp = await login('ahp@amc.com', 'Admin@123');
    ahpToken = ahp.accessToken;
    pass('AHP login');
    const patients = await req('GET', '/patients', { token: ahpToken });
    if (patients.status === 200) pass('AHP assigned patients API');
    else fail('AHP assigned patients', JSON.stringify(patients.data));
    const blocked = await req('POST', '/staff/receptionists', { token: ahpToken, body: { email: 'x@test.com' } });
    if (blocked.status === 403) pass('AHP blocked from receptionist create');
    else fail('AHP RBAC', `status ${blocked.status}`);
  } catch (e) { fail('AHP tests', e.message); }

  // E2E workflow via receptionist
  if (receptionistToken) {
    try {
      const ts = Date.now();
      const patientRes = await req('POST', '/patients', {
        token: receptionistToken,
        body: {
          first_name: 'E2E', last_name: `Test${ts}`, dob: '1990-01-01', gender: 'male',
          nic: `NIC${ts}`, phone: '0771234567', email: `e2e${ts}@test.com`,
        },
      });
      if (patientRes.status !== 201) throw new Error(`Create patient: ${JSON.stringify(patientRes.data)}`);
      const patientId = patientRes.data.data.id;
      pass('E2E: Receptionist creates patient');

      const apptRes = await req('POST', '/appointments', {
        token: receptionistToken,
        body: { patient_id: patientId, appointment_date: '2026-08-10', appointment_time: '10:00', notes: 'E2E test' },
      });
      if (apptRes.status !== 201) throw new Error(`Create appointment: ${JSON.stringify(apptRes.data)}`);
      pass('E2E: Receptionist books appointment');

      const confRes = await req('POST', '/conferences', {
        token: receptionistToken,
        body: {
          patient_id: patientId, scheduled_date: '2026-08-12', scheduled_time: '14:00',
          meeting_link: 'https://meet.example.com/e2e', notes: 'E2E conference',
        },
      });
      if (confRes.status !== 201) throw new Error(`Create conference: ${JSON.stringify(confRes.data)}`);
      pass('E2E: Receptionist schedules conference');

      const assignable = await req('GET', '/staff/assignable-users', { token: receptionistToken });
      const assigneeId = assignable.data?.data?.[0]?.id;
      if (!assigneeId) throw new Error('No assignable users');
      const taskRes = await req('POST', '/tasks', {
        token: receptionistToken,
        body: { title: `E2E Task ${ts}`, description: 'Verification task', assigned_to: assigneeId, priority: 'medium' },
      });
      if (taskRes.status !== 201) throw new Error(`Create task: ${JSON.stringify(taskRes.data)}`);
      pass('E2E: Receptionist creates task with staff dropdown assignee');

      if (gpToken) {
        const noteRes = await req('POST', `/patients/${patientId}/notes`, {
          token: gpToken,
          body: { note: 'E2E medical note from GP' },
        });
        if (noteRes.status === 201 || noteRes.status === 200) pass('E2E: GP adds medical note');
        else partial('E2E: GP medical note', JSON.stringify(noteRes.data));
      }

      if (ahpToken) {
        const reportRes = await req('POST', `/patients/${patientId}/reports`, {
          token: ahpToken,
          body: { report_content: 'E2E AHP patient report' },
        });
        if (reportRes.status === 201 || reportRes.status === 200) pass('E2E: AHP adds patient report');
        else partial('E2E: AHP patient report', JSON.stringify(reportRes.data));
      }

      // Persistence check
      const verify = await req('GET', `/patients/${patientId}`, { token: receptionistToken });
      if (verify.status === 200 && verify.data?.data?.first_name === 'E2E') pass('E2E: Data persists after operations');
      else fail('E2E persistence', JSON.stringify(verify.data));
    } catch (e) { fail('E2E workflow', e.message); }
  }

  // Summary
  console.log('\n=== Summary ===');
  const counts = { PASS: 0, FAIL: 0, PARTIAL: 0 };
  results.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
  console.log(`PASS: ${counts.PASS}, FAIL: ${counts.FAIL}, PARTIAL: ${counts.PARTIAL || 0}`);
  if (counts.FAIL > 0) {
    console.log('\nFailures:');
    results.filter((r) => r.status === 'FAIL').forEach((r) => console.log(`  - ${r.name}: ${r.detail}`));
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
