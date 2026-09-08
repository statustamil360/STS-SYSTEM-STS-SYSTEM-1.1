require('./env');

const defaultClientUrl = process.env.NODE_ENV === 'production'
  ? 'https://team.asterixmc.com'
  : 'http://localhost:5173';

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || process.env.PUBLIC_URL || defaultClientUrl,
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
};
