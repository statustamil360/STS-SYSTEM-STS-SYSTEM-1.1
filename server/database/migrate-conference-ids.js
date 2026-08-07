require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../config/db');
const {
  CONFERENCE_SEQUENCE_TABLE,
  formatConferenceCode,
  ensureConferenceSequence,
} = require('../utils/conferenceId');

(async () => {
  const connection = await pool.getConnection();
  try {
    await ensureConferenceSequence(connection);
    await connection.beginTransaction();

    const [conferences] = await connection.execute(
      'SELECT id FROM conferences ORDER BY created_at ASC, id ASC'
    );

    await connection.execute('UPDATE conferences SET conference_code = NULL');

    let sequence = 0;
    for (const conference of conferences) {
      sequence += 1;
      const conferenceCode = formatConferenceCode(sequence);
      await connection.execute(
        'UPDATE conferences SET conference_code = ? WHERE id = ?',
        [conferenceCode, conference.id]
      );
      console.log(`Conference ${conference.id} -> ${conferenceCode}`);
    }

    await connection.execute(
      `UPDATE ${CONFERENCE_SEQUENCE_TABLE} SET last_number = ? WHERE id = 1`,
      [sequence]
    );

    await connection.commit();
    console.log(
      `Renumbered ${sequence} conference(s). Next ID: ${formatConferenceCode(sequence + 1)}`
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
