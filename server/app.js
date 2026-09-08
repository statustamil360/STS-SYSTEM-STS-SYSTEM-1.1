const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const { uploadDir } = require('./config/jwt');
const { corsOrigin } = require('./config/corsOrigins');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { recordRequest } = require('./utils/requestMetrics');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const staffRoutes = require('./routes/staffRoutes');
const patientRoutes = require('./routes/patientRoutes');
const conferenceRoutes = require('./routes/conferenceRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const taskRoutes = require('./routes/taskRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditRoutes = require('./routes/auditRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const preferencesRoutes = require('./routes/preferencesRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const todoRoutes = require('./routes/todoRoutes');
const recordingRoutes = require('./routes/recordingRoutes');

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const jitsiOrigin = (() => {
  try {
    return new URL(process.env.JITSI_BASE_URL || 'https://meet.asterixmc.com').origin;
  } catch {
    return 'https://meet.asterixmc.com';
  }
})();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", jitsiOrigin],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      connectSrc: ["'self'", 'https:', 'wss:', 'stun:', 'turn:', 'turns:'],
      frameSrc: ["'self'", jitsiOrigin, 'blob:', 'data:'],
      childSrc: ["'self'", jitsiOrigin, 'blob:', 'data:'],
      objectSrc: ["'self'", 'blob:', 'data:'],
      workerSrc: ["'self'", 'blob:'],
      mediaSrc: ["'self'", 'blob:', 'mediastream:', 'data:'],
    },
  },
}));
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (!req.path.startsWith('/api')) return;
    const bytes = Number(res.getHeader('content-length')) || 0;
    recordRequest({ durationMs: Date.now() - start, bytes, path: req.path });
  });
  next();
});

app.use('/uploads', express.static(path.join(__dirname, uploadDir)));

const isDev = process.env.NODE_ENV !== 'production';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const path = req.originalUrl || req.url || '';
    return path.includes('/auth/me') || path.includes('/auth/refresh') || path.includes('/health');
  },
  message: { success: false, message: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many login attempts, please try again later' },
});

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'AMC Teleconference API is running' });
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/conferences', conferenceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/recordings', recordingRoutes);

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist, { index: false, maxAge: '1d' }));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) next(err);
    });
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
