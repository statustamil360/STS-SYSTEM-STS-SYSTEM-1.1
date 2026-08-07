const {
  formatSequenceCode,
  ensureSequenceTable,
  allocateSequenceNumber,
} = require('./sequenceCode');

const APPOINTMENT_SEQUENCE_TABLE = 'appointment_id_sequence';

const formatAppointmentCode = (sequenceNumber) => formatSequenceCode('APT', sequenceNumber);

const ensureAppointmentSequence = (connection) => ensureSequenceTable(
  connection,
  APPOINTMENT_SEQUENCE_TABLE
);

const allocateAppointmentCode = async (connection) => formatAppointmentCode(
  await allocateSequenceNumber(connection, APPOINTMENT_SEQUENCE_TABLE)
);

module.exports = {
  APPOINTMENT_SEQUENCE_TABLE,
  formatAppointmentCode,
  ensureAppointmentSequence,
  allocateAppointmentCode,
};
