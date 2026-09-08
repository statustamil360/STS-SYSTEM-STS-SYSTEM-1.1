const pool = require('../config/db');
const { countOpenSessions } = require('./conferenceAttendanceService');
const {
  emitConferenceEmpty,
  emitConferenceOccupied,
  emitConferenceEmptyContinued,
} = require('./socketService');

const EMPTY_WAIT_MS = 60 * 1000;
const timers = new Map();

const clearTimer = (conferenceId) => {
  const key = String(conferenceId);
  const timer = timers.get(key);
  if (timer) {
    clearTimeout(timer);
    timers.delete(key);
  }
};

const loadMeeting = async (conferenceId) => {
  const [rows] = await pool.execute(
    `SELECT c.id, c.conference_code, c.status,
            DATE_FORMAT(c.scheduled_date, '%Y-%m-%d') AS scheduled_date,
            TIME_FORMAT(c.scheduled_time, '%H:%i:%s') AS scheduled_time,
            TIME_FORMAT(c.accepted_at, '%H:%i:%s') AS started_time,
            CONCAT(pat.first_name, ' ', pat.last_name) AS patient_name,
            (
              SELECT DATE_FORMAT(MAX(s.left_at), '%Y-%m-%d %H:%i:%s')
              FROM conference_participant_sessions s
              WHERE s.conference_id = c.id AND s.left_at IS NOT NULL
            ) AS last_left_at,
            (
              SELECT TIME_FORMAT(MAX(s.left_at), '%H:%i:%s')
              FROM conference_participant_sessions s
              WHERE s.conference_id = c.id AND s.left_at IS NOT NULL
            ) AS last_left_time
     FROM conferences c
     JOIN patients pat ON pat.id = c.patient_id
     WHERE c.id = ?`,
    [conferenceId]
  );
  return rows[0] || null;
};

const fireEmptyPrompt = async (conferenceId) => {
  timers.delete(String(conferenceId));
  const meeting = await loadMeeting(conferenceId);
  if (!meeting || !['waiting', 'live'].includes(meeting.status)) return;
  const stillIn = await countOpenSessions(conferenceId);
  if (stillIn > 0) return;
  emitConferenceEmpty({
    id: meeting.id,
    conference_id: meeting.id,
    conference_code: meeting.conference_code,
    patient_name: meeting.patient_name,
    scheduled_date: meeting.scheduled_date,
    scheduled_time: meeting.scheduled_time,
    started_time: meeting.started_time,
    last_left_at: meeting.last_left_at,
    last_left_time: meeting.last_left_time,
    status: meeting.status,
  });
};

const scheduleEmptyCheck = async (conferenceId) => {
  if (!conferenceId) return;
  clearTimer(conferenceId);
  const meeting = await loadMeeting(conferenceId);
  if (!meeting || !['waiting', 'live'].includes(meeting.status)) return;
  const stillIn = await countOpenSessions(conferenceId);
  if (stillIn > 0) {
    emitConferenceOccupied({ conferenceId: Number(conferenceId) });
    return;
  }
  timers.set(
    String(conferenceId),
    setTimeout(() => {
      fireEmptyPrompt(conferenceId).catch((err) => {
        console.error('[empty-meeting]', err.message);
      });
    }, EMPTY_WAIT_MS)
  );
};

const markOccupied = (conferenceId) => {
  if (!conferenceId) return;
  clearTimer(conferenceId);
  emitConferenceOccupied({ conferenceId: Number(conferenceId) });
};

const cancelEmptyWatch = (conferenceId) => {
  clearTimer(conferenceId);
};

const continueEmptyMeeting = async (conferenceId) => {
  emitConferenceEmptyContinued({ conferenceId: Number(conferenceId) });
  await scheduleEmptyCheck(conferenceId);
};

module.exports = {
  EMPTY_WAIT_MS,
  scheduleEmptyCheck,
  markOccupied,
  cancelEmptyWatch,
  continueEmptyMeeting,
};
