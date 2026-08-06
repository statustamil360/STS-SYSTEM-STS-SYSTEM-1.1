const pool = require('../config/db');

const createAuditLog = async ({
  userId,
  action,
  entityType = null,
  entityId = null,
  details = null,
  ipAddress = null,
}) => {
  try {
    await pool.execute(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        action,
        entityType,
        entityId,
        details ? JSON.stringify(details) : null,
        ipAddress,
      ]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

const auditMiddleware = (action, entityType = null) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
      createAuditLog({
        userId: req.user.id,
        action,
        entityType,
        entityId: req.params.id ? parseInt(req.params.id, 10) : null,
        details: { method: req.method, path: req.originalUrl },
        ipAddress: req.ip,
      });
    }
    return originalJson(body);
  };
  next();
};

module.exports = { createAuditLog, auditMiddleware };
