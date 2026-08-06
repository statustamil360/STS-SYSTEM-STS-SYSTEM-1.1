require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../config/db');
const { formatPatientCode, ensureSequenceTable } = require('../utils/patientId');

(async () => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await ensureSequenceTable(connection);

    const [patients] = await connection.execute(
      'SELECT id FROM patients ORDER BY created_at ASC, id ASC'
    );

    let sequence = 0;
    for (const patient of patients) {
      sequence += 1;
      const patientCode = formatPatientCode(sequence);
      await connection.execute(
        'UPDATE patients SET patient_code = ? WHERE id = ?',
        [patientCode, patient.id]
      );
      console.log(`Patient ${patient.id} -> ${patientCode}`);
    }

    await connection.execute(
      'UPDATE patient_id_sequence SET last_number = ? WHERE id = 1',
      [sequence]
    );

    await connection.commit();
    console.log(`Renumbered ${sequence} patient(s). Next ID: ${formatPatientCode(sequence + 1)}`);
    process.exit(0);
  } catch (err) {
    await connection.rollback();
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    connection.release();
  }
})();
