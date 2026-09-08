require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  const dbName = process.env.DB_NAME || 'amc_asterix';
  const [dbs] = await connection.query(`SHOW DATABASES LIKE ${connection.escape(dbName)}`);
  let needsSchema = true;
  if (dbs.length) {
    const [tables] = await connection.query(
      `SHOW TABLES FROM \`${dbName}\` LIKE 'roles'`
    );
    needsSchema = !tables.length;
  }

  if (needsSchema) {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await connection.query(schema);
    console.log('Database schema created.');
  } else {
    console.log('Database schema already exists, skipping creation.');
  }

  await connection.query(`USE \`${dbName}\``);

  const [profTable] = await connection.query("SHOW TABLES LIKE 'ahp_professions'");
  if (!profTable.length) {
    const migration = fs.readFileSync(path.join(__dirname, 'migrations/002_ahp_professions.sql'), 'utf8');
    await connection.query(migration);
    console.log('AHP professions table created.');
  }

  const [confVideoCol] = await connection.query("SHOW COLUMNS FROM conferences LIKE 'appointment_id'");
  if (!confVideoCol.length) {
    try {
      const migration = fs.readFileSync(path.join(__dirname, 'migrations/005_conference_video.sql'), 'utf8');
      await connection.query(migration);
      console.log('Conference video migration applied.');
    } catch (err) {
      if (!err.message?.includes('Duplicate')) throw err;
    }
  }

  const defaultProfessions = [
    'Physiotherapist',
    'Occupational Therapist',
    'Speech Therapist',
    'Dietitian',
    'Psychologist',
    'Social Worker',
  ];
  for (const name of defaultProfessions) {
    await connection.query('INSERT IGNORE INTO ahp_professions (name) VALUES (?)', [name]);
  }

  const passwordHash = await bcrypt.hash('Admin@123', 12);

  await connection.query(`
    INSERT IGNORE INTO roles (id, name, description) VALUES
      (1, 'super_admin', 'Highest authority'),
      (2, 'admin', 'Hospital administrator'),
      (3, 'receptionist', 'Front desk manager'),
      (4, 'gp', 'General Practitioner'),
      (5, 'ahp', 'Allied Health Professional');
  `);

  const [existing] = await connection.query(
    "SELECT id FROM users WHERE email = 'superadmin@amc.com'"
  );

  if (!existing.length) {
    await connection.query(
      `INSERT INTO users (role_id, email, username, password_hash, status)
       VALUES (1, 'superadmin@amc.com', 'superadmin', ?, 'active')`,
      [passwordHash]
    );
    await connection.query(
      `INSERT INTO user_profiles (user_id, first_name, last_name, phone)
       VALUES (LAST_INSERT_ID(), 'Super', 'Admin', '+94770000001')`
    );
  }

  await connection.query(`
    INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
      ('hospital_name', 'AMC Healthcare'),
      ('timezone', 'Asia/Colombo'),
      ('language', 'en'),
      ('theme', 'light'),
      ('conference_open_lead_minutes', '15');
  `);

  const demoPassword = await bcrypt.hash('Admin@123', 12);
  const superAdminId = (await connection.query("SELECT id FROM users WHERE email = 'superadmin@amc.com'"))[0][0]?.id;

  const ensureUser = async (email, roleId, username, firstName, lastName, phone) => {
    const [existingUser] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length) return existingUser[0].id;
    const [result] = await connection.query(
      'INSERT INTO users (role_id, email, username, password_hash, status) VALUES (?, ?, ?, ?, ?)',
      [roleId, email, username, demoPassword, 'active']
    );
    const userId = result.insertId;
    await connection.query(
      'INSERT INTO user_profiles (user_id, first_name, last_name, phone) VALUES (?, ?, ?, ?)',
      [userId, firstName, lastName, phone]
    );
    return userId;
  };

  const adminUserId = await ensureUser('admin@amc.com', 2, 'admin_demo', 'Hospital', 'Admin', '+94771111001');
  const [existingAdmin] = await connection.query('SELECT id FROM admins WHERE user_id = ?', [adminUserId]);
  if (!existingAdmin.length) {
    await connection.query(
      'INSERT INTO admins (user_id, admin_code, created_by) VALUES (?, ?, ?)',
      [adminUserId, 'ADM-01', superAdminId || null]
    );
  }

  const receptionistUserId = await ensureUser('receptionist@amc.com', 3, 'receptionist_demo', 'Front', 'Desk', '+94771111002');
  const [existingRec] = await connection.query('SELECT id FROM receptionists WHERE user_id = ?', [receptionistUserId]);
  if (!existingRec.length) {
    await connection.query(
      'INSERT INTO receptionists (user_id, receptionist_code, created_by) VALUES (?, ?, ?)',
      [receptionistUserId, 'REC-001', adminUserId]
    );
  }
  await connection.query(
    "UPDATE receptionists SET receptionist_code = 'REC-001' WHERE user_id = ? AND receptionist_code <> 'REC-001'",
    [receptionistUserId]
  );

  const gpUserId = await ensureUser('gp@amc.com', 4, 'gp_demo', 'John', 'Smith', '+94771111003');
  const [existingGp] = await connection.query('SELECT id FROM gps WHERE user_id = ?', [gpUserId]);
  let gpId = existingGp[0]?.id;
  if (!existingGp.length) {
    const [gpResult] = await connection.query(
      'INSERT INTO gps (user_id, gp_code, specialization, registration_number, hospital, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [gpUserId, 'GP-01', 'General Medicine', 'SLMC-12345', 'AMC Healthcare', receptionistUserId]
    );
    gpId = gpResult.insertId;
  }
  await connection.query("UPDATE gps SET gp_code = 'GP-01' WHERE gp_code = 'GP-DEMO001'");

  const ahpUserId = await ensureUser('ahp@amc.com', 5, 'ahp_demo', 'Jane', 'Doe', '+94771111004');
  const [existingAhp] = await connection.query('SELECT id FROM allied_health_professionals WHERE user_id = ?', [ahpUserId]);
  let ahpId = existingAhp[0]?.id;
  if (!existingAhp.length) {
    const [ahpResult] = await connection.query(
      'INSERT INTO allied_health_professionals (user_id, ahp_code, profession, registration_number, created_by) VALUES (?, ?, ?, ?, ?)',
      [ahpUserId, 'AHP-DEMO001', 'Physiotherapist', 'AHP-67890', receptionistUserId]
    );
    ahpId = ahpResult.insertId;
  }

  const [existingPatients] = await connection.query('SELECT id FROM patients LIMIT 1');
  if (!existingPatients.length) {
    await connection.query(
      `INSERT INTO patients (patient_code, first_name, last_name, dob, gender, phone, status, created_by, assigned_gp_id, assigned_ahp_id)
       VALUES ('AMC-0001', 'Alice', 'Perera', '1985-03-15', 'female', '+94772222001', 'active', ?, ?, ?),
              ('AMC-0002', 'Bob', 'Fernando', '1978-07-22', 'male', '+94772222002', 'active', ?, ?, ?)`,
      [receptionistUserId, gpId, ahpId, receptionistUserId, gpId, ahpId]
    );
  }

  const [patients] = await connection.query('SELECT id FROM patients ORDER BY id LIMIT 2');
  const patientId = patients[0]?.id;
  const patientId2 = patients[1]?.id || patientId;

  // Demo appointment + linked conference for TODAY (always refresh dates)
  if (patientId && gpId && ahpId) {
    const [demoAppt] = await connection.query(
      "SELECT id FROM appointments WHERE appointment_code = 'APT-DEMO-TODAY' LIMIT 1"
    );

    let demoAppointmentId = demoAppt[0]?.id;
    if (!demoAppointmentId) {
      const [apptResult] = await connection.query(
        `INSERT INTO appointments (
          appointment_code, patient_id, gp_id, ahp_id, title,
          appointment_date, appointment_time, status, notes, created_by
        ) VALUES ('APT-DEMO-TODAY', ?, ?, ?, 'Demo Teleconference — Today', CURDATE(), '15:00:00', 'scheduled', 'Sample meeting for testing reception open and participant join', ?)`,
        [patientId, gpId, ahpId, receptionistUserId]
      );
      demoAppointmentId = apptResult.insertId;
      await connection.query(
        'INSERT IGNORE INTO appointment_gps (appointment_id, gp_id) VALUES (?, ?)',
        [demoAppointmentId, gpId]
      );
      await connection.query(
        'INSERT INTO appointment_ahps (appointment_id, profession, ahp_id) VALUES (?, ?, ?)',
        [demoAppointmentId, 'Physiotherapist', ahpId]
      );
    } else {
      await connection.query(
        `UPDATE appointments SET patient_id = ?, gp_id = ?, ahp_id = ?,
         appointment_date = CURDATE(), appointment_time = '15:00:00', status = 'scheduled'
         WHERE id = ?`,
        [patientId, gpId, ahpId, demoAppointmentId]
      );
    }

    const { syncConferenceFromAppointment } = require('../services/conferenceSync');
    await syncConferenceFromAppointment(connection, demoAppointmentId, receptionistUserId);

    // Second demo meeting later today
    const [demoAppt2] = await connection.query(
      "SELECT id FROM appointments WHERE appointment_code = 'APT-DEMO-TODAY-2' LIMIT 1"
    );
    let demoAppointmentId2 = demoAppt2[0]?.id;
    if (!demoAppointmentId2 && patientId2) {
      const [apptResult2] = await connection.query(
        `INSERT INTO appointments (
          appointment_code, patient_id, gp_id, ahp_id, title,
          appointment_date, appointment_time, status, notes, created_by
        ) VALUES ('APT-DEMO-TODAY-2', ?, ?, ?, 'Follow-up Teleconference', CURDATE(), '16:30:00', 'scheduled', 'Second sample meeting today', ?)`,
        [patientId2, gpId, ahpId, receptionistUserId]
      );
      demoAppointmentId2 = apptResult2.insertId;
      await connection.query(
        'INSERT IGNORE INTO appointment_gps (appointment_id, gp_id) VALUES (?, ?)',
        [demoAppointmentId2, gpId]
      );
      await connection.query(
        'INSERT INTO appointment_ahps (appointment_id, profession, ahp_id) VALUES (?, ?, ?)',
        [demoAppointmentId2, 'Physiotherapist', ahpId]
      );
    } else if (demoAppointmentId2) {
      await connection.query(
        `UPDATE appointments SET appointment_date = CURDATE(), appointment_time = '16:30:00', status = 'scheduled' WHERE id = ?`,
        [demoAppointmentId2]
      );
    }
    if (demoAppointmentId2) {
      await syncConferenceFromAppointment(connection, demoAppointmentId2, receptionistUserId);
    }

    // Legacy standalone conference — keep on today for GP/AHP cards
    const [existingConference] = await connection.query(
      "SELECT id FROM conferences WHERE conference_code = 'CONF-DEMO001' LIMIT 1"
    );
    if (!existingConference.length) {
      await connection.query(
        `INSERT INTO conferences (conference_code, patient_id, gp_id, ahp_id, scheduled_date, scheduled_time, status, created_by)
         VALUES ('CONF-DEMO001', ?, ?, ?, CURDATE(), '11:00:00', 'scheduled', ?)`,
        [patientId, gpId, ahpId, receptionistUserId]
      );
    } else {
      await connection.query(
        `UPDATE conferences SET scheduled_date = CURDATE(), scheduled_time = '11:00:00',
         gp_id = ?, ahp_id = ?, patient_id = ?, status = 'scheduled'
         WHERE conference_code = 'CONF-DEMO001' AND appointment_id IS NULL`,
        [gpId, ahpId, patientId]
      );
    }

    const [orphanConfs] = await connection.query(
      'SELECT id, gp_id, ahp_id FROM conferences WHERE status NOT IN (\'cancelled\')'
    );
    for (const conf of orphanConfs) {
      const [hasParts] = await connection.query(
        'SELECT id FROM conference_participants WHERE conference_id = ? LIMIT 1',
        [conf.id]
      );
      if (hasParts.length) continue;
      const [gpUser] = await connection.query('SELECT user_id FROM gps WHERE id = ?', [conf.gp_id]);
      if (gpUser.length) {
        await connection.query(
          'INSERT INTO conference_participants (conference_id, user_id, role_in_conference) VALUES (?, ?, ?)',
          [conf.id, gpUser[0].user_id, 'gp']
        );
      }
      const [ahpUser] = await connection.query(
        'SELECT user_id FROM allied_health_professionals WHERE id = ?',
        [conf.ahp_id]
      );
      if (ahpUser.length) {
        await connection.query(
          'INSERT INTO conference_participants (conference_id, user_id, role_in_conference) VALUES (?, ?, ?)',
          [conf.id, ahpUser[0].user_id, 'ahp']
        );
      }
    }

    // Backfill conferences for any appointment missing a link
    const [missingLinks] = await connection.query(`
      SELECT a.id FROM appointments a
      LEFT JOIN conferences c ON c.appointment_id = a.id
      WHERE c.id IS NULL AND a.gp_id IS NOT NULL
    `);
    for (const row of missingLinks) {
      await syncConferenceFromAppointment(connection, row.id, receptionistUserId);
    }
  }

  const [existingTask] = await connection.query('SELECT id FROM tasks LIMIT 1');
  if (!existingTask.length) {
    await connection.query(
      `INSERT INTO tasks (title, description, assigned_to, assigned_by, priority, status, due_date)
       VALUES ('Review patient file', 'Prepare notes before teleconference', ?, ?, 'medium', 'pending', CURDATE())`,
      [receptionistUserId, adminUserId]
    );
  }

  console.log('Database seeded successfully!');
  console.log('Super Admin login: superadmin@amc.com / Admin@123');
  console.log('Demo Admin login: admin@amc.com / Admin@123');
  console.log('Demo Receptionist login: receptionist@amc.com / Admin@123');
  await connection.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
