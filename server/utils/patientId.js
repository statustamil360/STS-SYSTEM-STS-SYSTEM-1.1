const DIGIT_TIERS = [
  { max: 9999, digits: 4 },
  { max: 99999, digits: 5 },
  { max: 999999, digits: 6 },
  { max: 9999999, digits: 7 },
  { max: 99999999, digits: 8 },
  { max: 999999999, digits: 9 },
  { max: 9999999999, digits: 10 },
];

const formatPatientCode = (sequenceNumber) => {
  const n = Number(sequenceNumber);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error('Invalid patient sequence number');
  }

  const tier = DIGIT_TIERS.find((t) => n <= t.max);
  if (!tier) {
    throw new Error('Patient ID limit reached (10 digits)');
  }

  return `AMC-${String(n).padStart(tier.digits, '0')}`;
};

const ensureSequenceTable = async (connection) => {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS patient_id_sequence (
      id INT PRIMARY KEY DEFAULT 1,
      last_number BIGINT NOT NULL DEFAULT 0
    )
  `);
  await connection.execute(
    'INSERT IGNORE INTO patient_id_sequence (id, last_number) VALUES (1, 0)'
  );
};

const allocatePatientCode = async (pool) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await ensureSequenceTable(connection);

    const [rows] = await connection.execute(
      'SELECT last_number FROM patient_id_sequence WHERE id = 1 FOR UPDATE'
    );
    const nextNumber = Number(rows[0].last_number) + 1;

    await connection.execute(
      'UPDATE patient_id_sequence SET last_number = ? WHERE id = 1',
      [nextNumber]
    );

    const patientCode = formatPatientCode(nextNumber);
    await connection.commit();
    return patientCode;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

module.exports = { formatPatientCode, allocatePatientCode, ensureSequenceTable };
