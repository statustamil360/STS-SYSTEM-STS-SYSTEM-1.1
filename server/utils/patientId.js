const {
  formatSequenceCode,
  ensureSequenceTable: ensureTable,
  allocateSequenceNumber,
} = require('./sequenceCode');

const PATIENT_SEQUENCE_TABLE = 'patient_id_sequence';

const formatPatientCode = (sequenceNumber) => formatSequenceCode('AMC', sequenceNumber);

const ensureSequenceTable = (connection) => ensureTable(connection, PATIENT_SEQUENCE_TABLE);

const allocatePatientCode = async (pool) => {
  const connection = await pool.getConnection();
  try {
    await ensureSequenceTable(connection);
    await connection.beginTransaction();

    const nextNumber = await allocateSequenceNumber(connection, PATIENT_SEQUENCE_TABLE);
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

module.exports = {
  PATIENT_SEQUENCE_TABLE,
  formatPatientCode,
  allocatePatientCode,
  ensureSequenceTable,
};
