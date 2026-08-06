/**
 * Role-by-role page/API verification for AMC system.
 */
const BASE = 'http://localhost:5000/api';
const results = [];

const log = (role, check, ok, detail = '') => {
  const status = ok ? 'PASS' : 'FAIL';
  results.push({ role, check, status, detail });
  console.log(`${ok ? '✓' : '✗'} [${role}] ${check}${detail ? ` — ${detail}` : ''}`);
};

async function req(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('json') ? await res.json() : await res.text();
  return { status: res.status, data };
}

async function login(email, password) {
  const { status, data } = await req('POST', '/auth/login', { body: { email, password } });
  if (status !== 200) throw new Error(`Login failed ${email}: ${JSON.stringify(data)}`);
  return { token: data.data.accessToken, user: data.data.user };
}

async function testPages(role, token, pages) {
  for (const [name, path] of pages) {
    const { status, data } = await req('GET', path, { token });
    log(role, `Page API: ${name}`, status === 200, status !== 200 ? `HTTP ${status}` : '');
  }
}

async function testBlocked(role, token, path, method = 'GET') {
  const { status } = await req(method, path, { token });
  log(role, `Blocked: ${path}`, status === 403, status !== 403 ? `got ${status}` : '');
}

async function main() {
  console.log('\n=== Role-by-Role System Test ===\n');

  // Verify services
  try {
    const fe = await fetch('http://localhost:5173');
    log('SYSTEM', 'Frontend reachable', fe.status === 200, `HTTP ${fe.status}`);
  } catch (e) { log('SYSTEM', 'Frontend reachable', false, e.message); }

  try {
    const { status } = await req('GET', '/dashboard/stats');
    log('SYSTEM', 'Backend reachable', status === 401, `HTTP ${status}`);
  } catch (e) { log('SYSTEM', 'Backend reachable', false, e.message); }

  // SUPER ADMIN
  const sa = await login('superadmin@amc.com', 'Admin@123');
  log('SUPER ADMIN', 'Login', true, sa.user.role);
  await testPages('SUPER ADMIN', sa.token, [
    ['Dashboard', '/dashboard/stats'],
    ['Admins', '/admins'],
    ['Audit Logs', '/audit?page=1&limit=10'],
    ['Reports', '/reports'],
    ['Settings', '/settings'],
    ['Notifications', '/notifications'],
    ['Profile', '/auth/me'],
  ]);
  await testBlocked('SUPER ADMIN', sa.token, '/staff/receptionists', 'POST');

  // ADMIN
  const ad = await login('admin@amc.com', 'Admin@123');
  log('ADMIN', 'Login', true, ad.user.role);
  await testPages('ADMIN', ad.token, [
    ['Dashboard', '/dashboard/stats'],
    ['Receptionists', '/staff/receptionists'],
    ['GPs', '/staff/gps'],
    ['AHPs', '/staff/ahps'],
    ['Patients', '/patients'],
    ['Reports', '/reports'],
    ['Audit Logs', '/audit?page=1&limit=10'],
    ['Settings', '/settings'],
    ['Notifications', '/notifications'],
  ]);
  await testBlocked('ADMIN', ad.token, '/admins');

  // Admin create receptionist (safe unique email)
  const ts = Date.now();
  const recCreate = await req('POST', '/staff/receptionists', {
    token: ad.token,
    body: {
      first_name: 'RunTest', last_name: 'Receptionist', email: `runtest.rec.${ts}@amc.com`,
      phone: '+94770000001', password: 'Reception@123', confirmPassword: 'Reception@123',
    },
  });
  log('ADMIN', 'Create Receptionist', recCreate.status === 201, recCreate.status !== 201 ? JSON.stringify(recCreate.data) : '');

  // Super Admin create admin
  const adminCreate = await req('POST', '/admins', {
    token: sa.token,
    body: {
      first_name: 'RunTest', last_name: 'Admin', email: `runtest.admin.${ts}@amc.com`,
      phone: '+94770000002', password: 'Admin@123', confirmPassword: 'Admin@123',
    },
  });
  log('SUPER ADMIN', 'Create Admin', adminCreate.status === 201, adminCreate.status !== 201 ? JSON.stringify(adminCreate.data) : '');

  // RECEPTIONIST
  const rc = await login('receptionist@amc.com', 'Admin@123');
  log('RECEPTIONIST', 'Login', true, rc.user.role);
  await testPages('RECEPTIONIST', rc.token, [
    ['Dashboard', '/dashboard/stats'],
    ['Patients', '/patients'],
    ['Appointments', '/appointments'],
    ['Conferences', '/conferences'],
    ['Tasks', '/tasks'],
    ['GPs', '/staff/gps'],
    ['AHPs', '/staff/ahps'],
    ['Notifications', '/notifications'],
  ]);
  await testBlocked('RECEPTIONIST', rc.token, '/admins');
  await testBlocked('RECEPTIONIST', rc.token, '/receptionists');

  // GP
  const gp = await login('gp@amc.com', 'Admin@123');
  log('GP', 'Login', true, gp.user.role);
  await testPages('GP', gp.token, [
    ['Dashboard', '/dashboard/stats'],
    ['Assigned Patients', '/patients'],
    ['Conferences', '/conferences'],
    ['Tasks', '/tasks'],
    ['Notifications', '/notifications'],
  ]);
  const gpPatients = await req('GET', '/patients', { token: gp.token });
  const gpPatientId = gpPatients.data?.data?.[0]?.id;
  if (gpPatientId) {
    const notes = await req('GET', `/patients/${gpPatientId}/notes`, { token: gp.token });
    log('GP', 'Medical Notes API', notes.status === 200, notes.status !== 200 ? `HTTP ${notes.status}` : '');
  } else {
    log('GP', 'Medical Notes API', true, 'no assigned patients to test notes endpoint');
  }
  await testBlocked('GP', gp.token, '/staff/receptionists');
  await testBlocked('GP', gp.token, '/appointments');

  // AHP
  const ahp = await login('ahp@amc.com', 'Admin@123');
  log('AHP', 'Login', true, ahp.user.role);
  await testPages('AHP', ahp.token, [
    ['Dashboard', '/dashboard/stats'],
    ['Assigned Patients', '/patients'],
    ['Conferences', '/conferences'],
    ['Tasks', '/tasks'],
    ['Notifications', '/notifications'],
  ]);
  const ahpPatients = await req('GET', '/patients', { token: ahp.token });
  const ahpPatientId = ahpPatients.data?.data?.[0]?.id;
  if (ahpPatientId) {
    const reports = await req('GET', `/patients/${ahpPatientId}/reports`, { token: ahp.token });
    log('AHP', 'Patient Reports API', reports.status === 200, reports.status !== 200 ? `HTTP ${reports.status}` : '');
  } else {
    log('AHP', 'Patient Reports API', true, 'no assigned patients to test reports endpoint');
  }
  await testBlocked('AHP', ahp.token, '/staff/receptionists', 'POST');

  // Summary
  const fails = results.filter((r) => r.status === 'FAIL');
  console.log(`\n=== Summary: ${results.length - fails.length}/${results.length} passed ===`);
  if (fails.length) {
    console.log('\nFailures:');
    fails.forEach((f) => console.log(`  [${f.role}] ${f.check}: ${f.detail}`));
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
