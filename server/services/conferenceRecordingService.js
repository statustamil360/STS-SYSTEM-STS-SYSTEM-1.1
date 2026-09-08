const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { uploadDir } = require('../config/jwt');

let schemaReady = false;

const recordingsRoot = () => {
  const root = path.isAbsolute(uploadDir)
    ? path.join(uploadDir, 'recordings')
    : path.join(__dirname, '..', uploadDir, 'recordings');
  fs.mkdirSync(root, { recursive: true });
  return root;
};

const ensureSchema = async () => {
  if (schemaReady) return;
  const [apptCols] = await pool.execute(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments' AND COLUMN_NAME = 'record_meeting'`
  );
  if (!Number(apptCols[0]?.cnt)) {
    await pool.execute(
      'ALTER TABLE appointments ADD COLUMN record_meeting TINYINT(1) NOT NULL DEFAULT 0'
    );
  }
  const [confCols] = await pool.execute(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'conferences' AND COLUMN_NAME = 'record_meeting'`
  );
  if (!Number(confCols[0]?.cnt)) {
    await pool.execute(
      'ALTER TABLE conferences ADD COLUMN record_meeting TINYINT(1) NOT NULL DEFAULT 0'
    );
  }
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS conference_recordings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      conference_id INT NOT NULL,
      status ENUM('requested', 'recording', 'ready', 'failed', 'not_recorded') NOT NULL DEFAULT 'requested',
      original_name VARCHAR(255),
      stored_name VARCHAR(255),
      file_path VARCHAR(500),
      mime_type VARCHAR(120) DEFAULT 'video/webm',
      file_size BIGINT DEFAULT 0,
      duration_seconds INT DEFAULT 0,
      started_at TIMESTAMP NULL,
      ended_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      recorder_user_id INT NULL,
      FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE
    )
  `);
  const [recCols] = await pool.execute(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'conference_recordings' AND COLUMN_NAME = 'recorder_user_id'`
  );
  if (!Number(recCols[0]?.cnt)) {
    await pool.execute('ALTER TABLE conference_recordings ADD COLUMN recorder_user_id INT NULL');
  }
  schemaReady = true;
};

const parseBool = (value) => {
  if (Buffer.isBuffer(value)) return Number(value[0]) === 1;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const text = String(value ?? '').trim().toLowerCase();
  return text === '1' || text === 'true' || text === 'on' || text === 'yes';
};

const getActiveRecording = async (conferenceId) => {
  await ensureSchema();
  const [rows] = await pool.execute(
    `SELECT * FROM conference_recordings
     WHERE conference_id = ? AND status IN ('requested', 'recording')
     ORDER BY id DESC LIMIT 1`,
    [conferenceId]
  );
  return rows[0] || null;
};

const getLatestRecording = async (conferenceId) => {
  await ensureSchema();
  const [rows] = await pool.execute(
    `SELECT * FROM conference_recordings WHERE conference_id = ? ORDER BY id DESC LIMIT 1`,
    [conferenceId]
  );
  return rows[0] || null;
};

const startRecording = async (conferenceId) => {
  await ensureSchema();
  const existing = await getActiveRecording(conferenceId);
  if (existing) return existing;

  const storedName = `conference-${conferenceId}-${Date.now()}.webm`;
  const absPath = path.join(recordingsRoot(), storedName);
  const relPath = path.join(uploadDir, 'recordings', storedName).replace(/\\/g, '/');
  fs.writeFileSync(absPath, Buffer.alloc(0));

  const [result] = await pool.execute(
    `INSERT INTO conference_recordings
      (conference_id, status, original_name, stored_name, file_path, mime_type, started_at)
     VALUES (?, 'recording', ?, ?, ?, 'video/webm', NOW())`,
    [conferenceId, storedName, storedName, relPath]
  );
  return {
    id: result.insertId,
    conference_id: conferenceId,
    status: 'recording',
    stored_name: storedName,
    file_path: relPath,
  };
};

const resolveFilePath = (filePath) => {
  if (!filePath) return null;
  if (path.isAbsolute(filePath)) return filePath;
  return path.join(__dirname, '..', filePath);
};

const appendChunk = async (conferenceId, buffer, userId = null) => {
  if (!buffer?.length) return getActiveRecording(conferenceId);
  let recording = await getActiveRecording(conferenceId);
  if (!recording) recording = await startRecording(conferenceId);
  if (recording.recorder_user_id && userId && Number(recording.recorder_user_id) !== Number(userId)) {
    return recording;
  }
  if (!recording.recorder_user_id && userId) {
    await pool.execute(
      'UPDATE conference_recordings SET recorder_user_id = ? WHERE id = ?',
      [userId, recording.id]
    );
    recording.recorder_user_id = userId;
  }
  const absPath = resolveFilePath(recording.file_path);
  fs.appendFileSync(absPath, buffer);
  const size = fs.statSync(absPath).size;
  await pool.execute(
    `UPDATE conference_recordings SET file_size = ?, status = 'recording', started_at = COALESCE(started_at, NOW()) WHERE id = ?`,
    [size, recording.id]
  );
  return { ...recording, file_size: size, status: 'recording' };
};

const recordingFileSize = (recording) => {
  const absPath = resolveFilePath(recording?.file_path);
  return absPath && fs.existsSync(absPath) ? fs.statSync(absPath).size : 0;
};

const waitForRecordingData = async (conferenceId, { timeoutMs = 8000, intervalMs = 400 } = {}) => {
  const started = Date.now();
  let lastSize = -1;
  let stableTicks = 0;
  while (Date.now() - started < timeoutMs) {
    const recording = await getActiveRecording(conferenceId) || await getLatestRecording(conferenceId);
    if (!recording) return null;
    const size = recordingFileSize(recording);
    if (size > 1024 && size === lastSize) {
      stableTicks += 1;
      if (stableTicks >= 2) return recording;
    } else {
      stableTicks = 0;
    }
    lastSize = size;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return getActiveRecording(conferenceId) || getLatestRecording(conferenceId);
};

const finalizeRecording = async (conferenceId) => {
  await ensureSchema();
  const recording = await getLatestRecording(conferenceId);
  if (!recording) {
    const [wanted] = await pool.execute(
      'SELECT record_meeting FROM conferences WHERE id = ?',
      [conferenceId]
    );
    if (parseBool(wanted[0]?.record_meeting)) {
      await pool.execute(
        `INSERT INTO conference_recordings (conference_id, status, ended_at)
         VALUES (?, 'not_recorded', NOW())`,
        [conferenceId]
      );
    }
    return null;
  }

  if (['ready', 'not_recorded', 'failed'].includes(recording.status)) {
    return recording;
  }

  const size = recordingFileSize(recording);
  const status = size > 1024 ? 'ready' : 'not_recorded';
  await pool.execute(
    `UPDATE conference_recordings
     SET status = ?, file_size = ?, ended_at = NOW()
     WHERE id = ?`,
    [status, size, recording.id]
  );
  return { ...recording, status, file_size: size };
};

const listRecordings = async ({ search = '', status = '', page = 1, limit = 15 } = {}) => {
  await ensureSchema();
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.max(parseInt(limit, 10) || 15, 1);
  const offset = (pageNum - 1) * pageSize;
  let where = 'WHERE 1=1';
  const params = [];
  if (status) {
    where += ' AND r.status = ?';
    params.push(status);
  }
  if (search) {
    where += ` AND (
      c.conference_code LIKE ? OR CONCAT(p.first_name, ' ', p.last_name) LIKE ?
      OR r.original_name LIKE ?
    )`;
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM conference_recordings r
     JOIN conferences c ON c.id = r.conference_id
     JOIN patients p ON p.id = c.patient_id
     ${where}`,
    params
  );
  const [rows] = await pool.execute(
    `SELECT r.*,
            DATE_FORMAT(c.scheduled_date, '%Y-%m-%d') AS scheduled_date,
            TIME_FORMAT(c.scheduled_time, '%H:%i:%s') AS scheduled_time,
            c.conference_code, c.status AS conference_status,
            CONCAT(p.first_name, ' ', p.last_name) AS patient_name, p.patient_code
     FROM conference_recordings r
     JOIN conferences c ON c.id = r.conference_id
     JOIN patients p ON p.id = c.patient_id
     ${where}
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  return {
    rows,
    pagination: { total: countRows[0].total, page: pageNum, limit: pageSize },
  };
};

const getRecordingById = async (id) => {
  await ensureSchema();
  const [rows] = await pool.execute(
    `SELECT r.*, c.conference_code,
            DATE_FORMAT(c.scheduled_date, '%Y-%m-%d') AS scheduled_date,
            TIME_FORMAT(c.scheduled_time, '%H:%i:%s') AS scheduled_time,
            CONCAT(p.first_name, ' ', p.last_name) AS patient_name
     FROM conference_recordings r
     JOIN conferences c ON c.id = r.conference_id
     JOIN patients p ON p.id = c.patient_id
     WHERE r.id = ?`,
    [id]
  );
  return rows[0] || null;
};

const recordingStatusForConference = async (conferenceId) => {
  const recording = await getLatestRecording(conferenceId);
  if (!recording) return { recorded: false, status: 'not_recorded', recording_id: null };
  return {
    recorded: recording.status === 'ready' && Number(recording.file_size) > 1024,
    status: recording.status,
    recording_id: recording.id,
    file_size: recording.file_size,
  };
};

module.exports = {
  ensureSchema,
  parseBool,
  startRecording,
  appendChunk,
  finalizeRecording,
  waitForRecordingData,
  listRecordings,
  getRecordingById,
  getLatestRecording,
  getActiveRecording,
  recordingStatusForConference,
  resolveFilePath,
};
