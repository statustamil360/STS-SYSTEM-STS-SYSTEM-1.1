const os = require('os');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { getDbMetrics } = require('../utils/dbMetrics');
const { getRequestMetrics } = require('../utils/requestMetrics');
const { uploadDir } = require('../config/jwt');

const SERVER_STARTED = Date.now();
let lastCpu = process.cpuUsage();

const folderSize = (dir) => {
  if (!fs.existsSync(dir)) return 0;
  let total = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += folderSize(full);
    else total += fs.statSync(full).size;
  });
  return total;
};

const getCpuPercent = () => {
  const current = process.cpuUsage(lastCpu);
  lastCpu = process.cpuUsage();
  const totalMicros = (current.user + current.system) / 1000;
  return Math.min(100, Math.round(totalMicros / 10));
};

exports.getMetrics = async (req, res, next) => {
  try {
    const pingStart = Date.now();
    await pool.execute('SELECT 1');
    const apiResponseMs = Date.now() - pingStart;

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryPercent = Math.round((usedMem / totalMem) * 100);

    const heap = process.memoryUsage();
    const heapPercent = Math.round((heap.heapUsed / heap.heapTotal) * 100);

    const uploadsPath = path.join(__dirname, '..', uploadDir);
    const uploadsBytes = folderSize(uploadsPath);
    const uploadsMb = uploadsBytes / (1024 * 1024);
    const storagePercent = Math.min(100, Math.round(uploadsMb));

    const [activeUsersRows] = await pool.execute(
      "SELECT COUNT(*) AS count FROM users WHERE status = 'active'"
    );
    const [poolStatus] = await pool.execute('SHOW STATUS LIKE "Threads_connected"');
    const dbConnections = Number(poolStatus[0]?.Value || 0);

    const uptimeSeconds = Math.floor(process.uptime());
    const uptimeHours = (uptimeSeconds / 3600).toFixed(1);

    const dbMetrics = getDbMetrics();
    const requestMetrics = getRequestMetrics();
    const cpuPercent = getCpuPercent();

    res.json({
      success: true,
      data: {
        status: 'Operational',
        uptimeSeconds,
        uptimeHours,
        apiResponseMs,
        activeSessions: Number(activeUsersRows[0]?.count || 0),
        dbConnections,
        serverStartedAt: SERVER_STARTED,
        resources: {
          cpu: { percent: cpuPercent, status: cpuPercent >= 85 ? 'High' : cpuPercent >= 70 ? 'Elevated' : 'Normal' },
          memory: { percent: memoryPercent, heapPercent, status: memoryPercent >= 85 ? 'High' : 'Normal' },
          storage: { percent: storagePercent, usedMb: Math.round(uploadsMb), status: storagePercent >= 85 ? 'High' : 'Normal' },
          network: {
            rps: requestMetrics.rps,
            bytesPerSec: requestMetrics.bytesPerSec,
            status: requestMetrics.rps >= 50 ? 'Busy' : 'Optimal',
          },
        },
        db: dbMetrics,
        requests: requestMetrics,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getDbStream = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        db: getDbMetrics(),
        requests: getRequestMetrics(),
        timestamp: Date.now(),
      },
    });
  } catch (err) {
    next(err);
  }
};
