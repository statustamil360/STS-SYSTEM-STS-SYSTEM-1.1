const {
  formatSequenceCode,
  ensureSequenceTable,
  allocateSequenceNumber,
} = require('./sequenceCode');

const CONFERENCE_SEQUENCE_TABLE = 'conference_id_sequence';

const formatConferenceCode = (sequenceNumber) => formatSequenceCode('CON', sequenceNumber);

const ensureConferenceSequence = (connection) => ensureSequenceTable(
  connection,
  CONFERENCE_SEQUENCE_TABLE
);

const allocateConferenceCode = async (connection) => formatConferenceCode(
  await allocateSequenceNumber(connection, CONFERENCE_SEQUENCE_TABLE)
);

module.exports = {
  CONFERENCE_SEQUENCE_TABLE,
  formatConferenceCode,
  ensureConferenceSequence,
  allocateConferenceCode,
};
