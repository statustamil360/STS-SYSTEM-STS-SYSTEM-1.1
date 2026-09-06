require('./env');
const mysql = require('mysql2/promise');
const { recordQuery } = require('../utils/dbMetrics');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'amc_asterix',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
});

const wrapExecute = (target) => {
  const original = target.execute.bind(target);
  target.execute = async (...args) => {
    const start = Date.now();
    try {
      const result = await original(...args);
      const rowCount = Array.isArray(result[0]) ? result[0].length : 0;
      recordQuery({ durationMs: Date.now() - start, rowCount });
      return result;
    } catch (err) {
      recordQuery({ durationMs: Date.now() - start, rowCount: 0, error: true });
      throw err;
    }
  };
};

wrapExecute(pool);

module.exports = pool;
