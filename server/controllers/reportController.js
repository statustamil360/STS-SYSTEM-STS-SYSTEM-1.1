const pool = require('../config/db');
const { createAuditLog } = require('../middleware/auditLog');

exports.generate = async (req, res, next) => {
  try {
    const { report_type, start_date, end_date } = req.body;
    let data = [];
    let title = '';

    switch (report_type) {
      case 'conference':
        [data] = await pool.execute(
          `SELECT c.*, CONCAT(p.first_name, ' ', p.last_name) AS patient_name
           FROM conferences c JOIN patients p ON c.patient_id = p.id
           WHERE c.scheduled_date BETWEEN ? AND ?`,
          [start_date, end_date]
        );
        title = 'Conference Report';
        break;
      case 'patient':
        [data] = await pool.execute('SELECT * FROM patients WHERE created_at BETWEEN ? AND ?', [start_date, end_date]);
        title = 'Patient Report';
        break;
      case 'gp':
        [data] = await pool.execute(
          `SELECT g.*, u.email, p.first_name, p.last_name FROM gps g
           JOIN users u ON g.user_id = u.id LEFT JOIN user_profiles p ON u.id = p.user_id`
        );
        title = 'GP Report';
        break;
      case 'ahp':
        [data] = await pool.execute(
          `SELECT a.*, u.email, p.first_name, p.last_name FROM allied_health_professionals a
           JOIN users u ON a.user_id = u.id LEFT JOIN user_profiles p ON u.id = p.user_id`
        );
        title = 'AHP Report';
        break;
      case 'activity':
        [data] = await pool.execute(
          'SELECT * FROM audit_logs WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC',
          [start_date, end_date]
        );
        title = 'Activity Report';
        break;
      case 'login':
        [data] = await pool.execute(
          'SELECT * FROM login_history WHERE login_at BETWEEN ? AND ? ORDER BY login_at DESC',
          [start_date, end_date]
        );
        title = 'Login Report';
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid report type' });
    }

    await pool.execute(
      'INSERT INTO reports (report_type, title, generated_by, parameters) VALUES (?, ?, ?, ?)',
      [report_type, title, req.user.id, JSON.stringify({ start_date, end_date })]
    );

    await createAuditLog({ userId: req.user.id, action: 'export', entityType: 'report', ipAddress: req.ip });

    const recordCount = data.length;
    const isCsv = req.query.format === 'csv';

    await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [
        req.user.id,
        isCsv ? 'Report Exported' : 'Report Generated',
        isCsv
          ? `${title} CSV export completed (${recordCount} record${recordCount === 1 ? '' : 's'}).`
          : `${title} generated successfully (${recordCount} record${recordCount === 1 ? '' : 's'}).`,
        'export',
      ],
    );

    if (isCsv) {
      if (!data.length) return res.send('');
      const keys = Object.keys(data[0]);
      const csv = [keys.join(','), ...data.map((r) => keys.map((k) => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${report_type}_report.csv`);
      return res.send(csv);
    }

    res.json({ success: true, data: { title, report_type, records: data, count: data.length } });
  } catch (err) { next(err); }
};

exports.getHistory = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*, u.email AS generated_by_email FROM reports r
       LEFT JOIN users u ON r.generated_by = u.id ORDER BY r.created_at DESC LIMIT 50`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};
