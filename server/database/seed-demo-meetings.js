require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const pool = require('../config/db');
const { syncConferenceFromAppointment } = require('../services/conferenceSync');
const { generateCode } = require('../utils/generateCode');

const ensureMigration = async (connection) => {
  const [cols] = await connection.query("SHOW COLUMNS FROM conferences LIKE 'appointment_id'");
  if (cols.length) return;
  const sql = fs.readFileSync(
    path.join(__dirname, 'migrations', '005_conference_video.sql'),
    'utf8'
  );
  await connection.query(sql);
  console.log('Applied migration 005_conference_video.');
};

const ensureParticipants = async (conn, conferenceId, gpId, ahpIds) => {
  const [existing] = await conn.execute(
    'SELECT id FROM conference_participants WHERE conference_id = ? LIMIT 1',
    [conferenceId]
  );
  if (existing.length) return;

  if (gpId) {
    const [gpUser] = await conn.execute('SELECT user_id FROM gps WHERE id = ?', [gpId]);
    if (gpUser.length) {
      await conn.execute(
        'INSERT INTO conference_participants (conference_id, user_id, role_in_conference) VALUES (?, ?, ?)',
        [conferenceId, gpUser[0].user_id, 'gp']
      );
    }
  }

  const uniqueAhps = [...new Set((ahpIds || []).filter(Boolean))];
  for (const ahpId of uniqueAhps) {
    const [ahpUser] = await conn.execute(
      'SELECT user_id FROM allied_health_professionals WHERE id = ?',
      [ahpId]
    );
    if (ahpUser.length) {
      await conn.execute(
        'INSERT INTO conference_participants (conference_id, user_id, role_in_conference) VALUES (?, ?, ?)',
        [conferenceId, ahpUser[0].user_id, 'ahp']
      );
    }
  }
};

const run = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'amc_asterix',
    multipleStatements: true,
  });

  try {
    await ensureMigration(connection);

    const [gpRows] = await connection.query('SELECT id, user_id FROM gps ORDER BY id LIMIT 1');
    const [ahpRows] = await connection.query('SELECT id, user_id FROM allied_health_professionals ORDER BY id LIMIT 1');
    const [patientRows] = await connection.query('SELECT id FROM patients ORDER BY id LIMIT 1');
    const [recRows] = await connection.query(
      "SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'receptionist' LIMIT 1"
    );

    const gpId = gpRows[0]?.id;
    const ahpId = ahpRows[0]?.id;
    const patientId = patientRows[0]?.id;
    const receptionistUserId = recRows[0]?.id;

    if (!gpId || !ahpId || !patientId || !receptionistUserId) {
      console.log('Missing demo GP/AHP/patient/receptionist — run npm run seed first.');
      return;
    }

    // Backfill: sync every appointment that has no linked conference
    const [appointments] = await connection.query(`
      SELECT a.id
      FROM appointments a
      LEFT JOIN conferences c ON c.appointment_id = a.id
      WHERE c.id IS NULL AND a.gp_id IS NOT NULL
    `);

    for (const row of appointments) {
      await syncConferenceFromAppointment(connection, row.id, receptionistUserId);
      console.log(`Synced conference for appointment #${row.id}`);
    }

    // Move user test appointments to today so sample cards appear immediately
    const [testAppts] = await connection.query(
      `SELECT id FROM appointments
       WHERE gp_id IS NOT NULL AND (
         title LIKE '%Test Conference%' OR title LIKE '%Demo%'
       ) AND appointment_date <> CURDATE()`
    );
    for (const row of testAppts) {
      await connection.query(
        'UPDATE appointments SET appointment_date = CURDATE() WHERE id = ?',
        [row.id]
      );
      await syncConferenceFromAppointment(connection, row.id, receptionistUserId);
      console.log(`Moved test appointment #${row.id} to today`);
    }

    // Ensure demo today appointment exists
    const [demoAppt] = await connection.query(
      "SELECT id FROM appointments WHERE appointment_code = 'APT-DEMO-TODAY' LIMIT 1"
    );

    let demoAppointmentId = demoAppt[0]?.id;
    if (!demoAppointmentId) {
      const code = 'APT-DEMO-TODAY';
      const [result] = await connection.query(
        `INSERT INTO appointments (
          appointment_code, patient_id, gp_id, ahp_id, title,
          appointment_date, appointment_time, status, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, CURDATE(), '15:00:00', 'scheduled', ?, ?)`,
        [
          code,
          patientId,
          gpId,
          ahpId,
          'Demo Teleconference — Today',
          'Sample meeting for reception open / participant join workflow',
          receptionistUserId,
        ]
      );
      demoAppointmentId = result.insertId;

      await connection.query(
        'INSERT INTO appointment_ahps (appointment_id, profession, ahp_id) VALUES (?, ?, ?)',
        [demoAppointmentId, 'Physiotherapist', ahpId]
      );
      console.log('Created demo today appointment.');
    } else {
      await connection.query(
        `UPDATE appointments SET
          patient_id = ?, gp_id = ?, ahp_id = ?,
          appointment_date = CURDATE(), appointment_time = '15:00:00',
          status = 'scheduled', title = 'Demo Teleconference — Today'
         WHERE id = ?`,
        [patientId, gpId, ahpId, demoAppointmentId]
      );
      console.log('Updated demo today appointment to CURDATE().');
    }

    await syncConferenceFromAppointment(connection, demoAppointmentId, receptionistUserId);

    // Second demo meeting later today
    const [demoAppt2] = await connection.query(
      "SELECT id FROM appointments WHERE appointment_code = 'APT-DEMO-TODAY-2' LIMIT 1"
    );
    let demoAppointmentId2 = demoAppt2[0]?.id;
    const [patient2] = await connection.query('SELECT id FROM patients ORDER BY id LIMIT 1 OFFSET 1');
    const patientId2 = patient2[0]?.id || patientId;

    if (!demoAppointmentId2) {
      const [result2] = await connection.query(
        `INSERT INTO appointments (
          appointment_code, patient_id, gp_id, ahp_id, title,
          appointment_date, appointment_time, status, notes, created_by
        ) VALUES ('APT-DEMO-TODAY-2', ?, ?, ?, 'Follow-up Teleconference', CURDATE(), '16:30:00', 'scheduled', 'Second sample meeting today', ?)`,
        [patientId2, gpId, ahpId, receptionistUserId]
      );
      demoAppointmentId2 = result2.insertId;
      await connection.query(
        'INSERT INTO appointment_ahps (appointment_id, profession, ahp_id) VALUES (?, ?, ?)',
        [demoAppointmentId2, 'Physiotherapist', ahpId]
      );
    } else {
      await connection.query(
        `UPDATE appointments SET appointment_date = CURDATE(), appointment_time = '16:30:00', status = 'scheduled' WHERE id = ?`,
        [demoAppointmentId2]
      );
    }
    await syncConferenceFromAppointment(connection, demoAppointmentId2, receptionistUserId);

    // Legacy standalone conference
    await connection.query(
      `UPDATE conferences SET
        scheduled_date = CURDATE(), scheduled_time = '11:00:00',
        gp_id = ?, ahp_id = ?, patient_id = ?, status = 'scheduled'
       WHERE conference_code = 'CONF-DEMO001' AND appointment_id IS NULL`,
      [gpId, ahpId, patientId]
    );

    // Participants for any conference still missing them
    const [conferences] = await connection.query(
      'SELECT id, gp_id, ahp_id FROM conferences WHERE status NOT IN (\'cancelled\')'
    );
    for (const conf of conferences) {
      const [ahpAssign] = await connection.query(
        `SELECT aa.ahp_id FROM conferences c
         JOIN appointments a ON a.id = c.appointment_id
         JOIN appointment_ahps aa ON aa.appointment_id = a.id
         WHERE c.id = ?`,
        [conf.id]
      );
      const ahpIds = ahpAssign.length
        ? ahpAssign.map((r) => r.ahp_id)
        : [conf.ahp_id].filter(Boolean);
      await ensureParticipants(connection, conf.id, conf.gp_id, ahpIds);
    }

    const [today] = await connection.query(`
      SELECT c.conference_code, c.scheduled_date, c.scheduled_time, c.status,
             (SELECT COUNT(*) FROM conference_participants cp WHERE cp.conference_id = c.id) AS participants
      FROM conferences c
      WHERE c.scheduled_date = CURDATE() AND c.status != 'cancelled'
      ORDER BY c.scheduled_time
    `);

    console.log('\nToday\'s demo conferences ready:');
    today.forEach((row) => {
      console.log(`  - ${row.conference_code} @ ${row.scheduled_time} (${row.participants} participants, ${row.status})`);
    });
    if (!today.length) console.log('  (none — check GP/AHP assignment on appointments)');

    console.log('\nDemo meetings backfill complete.');
  } finally {
    await connection.end();
    await pool.end?.();
  }
};

run().catch((err) => {
  console.error('Backfill failed:', err.message);
  process.exit(1);
});
