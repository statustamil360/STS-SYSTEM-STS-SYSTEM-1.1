const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/token');
const pool = require('../config/db');
const { registerMediasoupHandlers } = require('./mediasoupSocket');
const { corsOrigin } = require('../config/corsOrigins');

let io = null;

const conferenceRoom = (conferenceId) => `conference:${conferenceId}`;

const authenticateSocket = async (token) => {
  const decoded = verifyAccessToken(token);
  const [users] = await pool.execute(
    `SELECT u.id, u.email, u.username, u.status, r.name AS role
     FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
    [decoded.id]
  );
  if (!users.length || users[0].status !== 'active') {
    throw new Error('Invalid user');
  }
  return users[0];
};

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
    path: '/socket.io',
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication required'));
      socket.user = await authenticateSocket(token);
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    registerMediasoupHandlers(io, socket);

    socket.on('join-conference', ({ conferenceId }) => {
      if (!conferenceId) return;
      socket.join(conferenceRoom(conferenceId));
      socket.data.conferenceId = conferenceId;
    });

    socket.on('leave-conference', ({ conferenceId }) => {
      socket.leave(conferenceRoom(conferenceId));
    });

    socket.on('report-update', (payload) => {
      const { conferenceId, report } = payload || {};
      if (!conferenceId || !report) return;
      socket.to(conferenceRoom(conferenceId)).emit('report-updated', {
        report,
        updatedBy: {
          id: socket.user.id,
          role: socket.user.role,
        },
      });
    });

    socket.on('report-typing', (payload) => {
      const { conferenceId, reportUserId, section, typing } = payload || {};
      if (!conferenceId || !section) return;
      socket.to(conferenceRoom(conferenceId)).emit('report-typing', {
        reportUserId: Number(reportUserId) || socket.user.id,
        section: String(section),
        typing: Boolean(typing),
        userId: socket.user.id,
      });
    });

    socket.on('report-draft', (payload) => {
      const { conferenceId, reportUserId, section, content } = payload || {};
      if (!conferenceId || !section) return;
      socket.to(conferenceRoom(conferenceId)).emit('report-draft', {
        reportUserId: Number(reportUserId) || socket.user.id,
        section: String(section),
        content: String(content ?? ''),
        userId: socket.user.id,
      });
    });

    socket.on('disconnect', () => {
      const conferenceId = socket.data.conferenceId;
      if (!conferenceId || !socket.user?.id) return;
      socket.to(conferenceRoom(conferenceId)).emit('report-typing', {
        reportUserId: socket.user.id,
        section: '*',
        typing: false,
        userId: socket.user.id,
      });
    });
  });

  return io;
};

const getIo = () => io;

const emitReportUpdate = (conferenceId, report, updatedBy) => {
  if (!io) return;
  io.to(conferenceRoom(conferenceId)).emit('report-updated', { report, updatedBy });
};

const emitConferenceEnded = (conferenceId) => {
  if (!io) return;
  io.to(conferenceRoom(conferenceId)).emit('conference-ended', { conferenceId });
};

module.exports = { initSocket, getIo, emitReportUpdate, emitConferenceEnded, conferenceRoom };
