require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../config/db');
const {
  APPOINTMENT_SEQUENCE_TABLE,
  formatAppointmentCode,
  ensureAppointmentSequence,
} = require('../utils/appointmentId');

(async () => {
  const connection = await pool.getConnection();
  try {
    await ensureAppointmentSequence(connection);
    await connection.beginTransaction();

    const [appointments] = await connection.execute(
      'SELECT id FROM appointments ORDER BY created_at ASC, id ASC'
    );

    // appointment_code is UNIQUE, so clear it first to avoid collisions while renumbering.
    await connection.execute('UPDATE appointments SET appointment_code = NULL');

    let sequence = 0;
    for (const appointment of appointments) {
      sequence += 1;
      const appointmentCode = formatAppointmentCode(sequence);
      await connection.execute(
        'UPDATE appointments SET appointment_code = ? WHERE id = ?',
        [appointmentCode, appointment.id]
      );
      console.log(`Appointment ${appointment.id} -> ${appointmentCode}`);
    }

    await connection.execute(
      `UPDATE ${APPOINTMENT_SEQUENCE_TABLE} SET last_number = ? WHERE id = 1`,
      [sequence]
    );

    await connection.commit();
    console.log(
      `Renumbered ${sequence} appointment(s). Next ID: ${formatAppointmentCode(sequence + 1)}`
    );
    process.exit(0);
  } catch (err) {
    await connection.rollback();
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    connection.release();
  }
})();
