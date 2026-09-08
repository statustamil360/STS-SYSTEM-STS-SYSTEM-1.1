const fs = require('fs');
const path = require('path');
const multer = require('multer');
const pool = require('../config/db');
const {
  appendChunk,
  listRecordings,
  getRecordingById,
  getActiveRecording,
  resolveFilePath,
  ensureSchema,
} = require('../services/conferenceRecordingService');

const chunkUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 40 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const mime = String(file.mimetype || '').trim();
    const mimeOk = !mime || /webm|ogg|mp4|octet-stream|application\/octet-stream/i.test(mime);
    const nameOk = /\.(webm|ogg|mp4)$/i.test(file.originalname || '');
    if (mimeOk || nameOk) cb(null, true);
    else cb(new Error('Recording chunk must be a video file'));
  },
}).single('chunk');

const getConference = async (id) => {
  const [rows] = await pool.execute(
    'SELECT id, status, record_meeting FROM conferences WHERE id = ?',
    [id]
  );
  return rows[0] || null;
};

exports.uploadChunk = (req, res, next) => {
  chunkUpload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    try {
      await ensureSchema();
      const conference = await getConference(req.params.id);
      if (!conference) {
        return res.status(404).json({ success: false, message: 'Conference not found' });
      }
      const active = await getActiveRecording(conference.id);
      if (!active && !['waiting', 'live'].includes(conference.status)) {
        return res.status(400).json({ success: false, message: 'This meeting is not being recorded' });
      }
      if (!req.file?.buffer?.length) {
        return res.status(400).json({ success: false, message: 'Empty recording chunk' });
      }
      await appendChunk(conference.id, req.file.buffer, req.user.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
};

exports.list = async (req, res, next) => {
  try {
    const result = await listRecordings({
      search: req.query.search || '',
      status: req.query.status || '',
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json({ success: true, data: result.rows, pagination: result.pagination });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const recording = await getRecordingById(req.params.id);
    if (!recording) {
      return res.status(404).json({ success: false, message: 'Recording not found' });
    }
    res.json({ success: true, data: recording });
  } catch (err) { next(err); }
};

const openRecordingFile = async (req, res, { download = false } = {}) => {
  const recording = await getRecordingById(req.params.id);
  if (!recording) {
    return res.status(404).json({ success: false, message: 'Recording not found' });
  }
  const absPath = resolveFilePath(recording.file_path);
  if (!absPath || !fs.existsSync(absPath)) {
    return res.status(404).json({ success: false, message: 'Recording file is missing' });
  }
  const stat = fs.statSync(absPath);
  const mime = recording.mime_type || 'video/webm';
  const filename = recording.original_name || recording.stored_name || `recording-${recording.id}.webm`;
  res.setHeader('Content-Type', mime);
  res.setHeader('Accept-Ranges', 'bytes');
  if (download) {
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filename)}"`);
  } else {
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(filename)}"`);
  }

  const range = req.headers.range;
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    const start = match?.[1] ? Number(match[1]) : 0;
    const end = match?.[2] ? Number(match[2]) : stat.size - 1;
    if (start >= stat.size || end >= stat.size) {
      res.status(416).setHeader('Content-Range', `bytes */${stat.size}`);
      return res.end();
    }
    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
    res.setHeader('Content-Length', end - start + 1);
    return fs.createReadStream(absPath, { start, end }).pipe(res);
  }

  res.setHeader('Content-Length', stat.size);
  return fs.createReadStream(absPath).pipe(res);
};

exports.stream = async (req, res, next) => {
  try {
    await openRecordingFile(req, res, { download: false });
  } catch (err) { next(err); }
};

exports.download = async (req, res, next) => {
  try {
    await openRecordingFile(req, res, { download: true });
  } catch (err) { next(err); }
};
