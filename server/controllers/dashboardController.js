const pool = require('../config/db');
const { getMonthlyJoinSummary } = require('../services/conferenceAttendanceService');

const today = () => new Date().toISOString().split('T')[0];

exports.getStats = async (req, res, next) => {
  try {
    const role = req.user.role;
    let stats = {};

    if (role === 'super_admin') {
      const [adminRows, userRows, conferenceRows] = await Promise.all([
        pool.execute("SELECT COUNT(*) as count FROM admins a JOIN users u ON a.user_id = u.id WHERE u.status = 'active'"),
        pool.execute("SELECT COUNT(*) as count FROM users WHERE status = 'active'"),
        pool.execute("SELECT COUNT(*) as count FROM conferences WHERE status IN ('scheduled', 'live', 'waiting')"),
      ]);
      stats = {
        totalAdmins: Number(adminRows[0][0].count),
        activeUsers: Number(userRows[0][0].count),
        activeConferences: Number(conferenceRows[0][0].count),
        systemHealth: 'Healthy',
      };
    } else if (role === 'admin') {
      const [[receptionists], [patients], [gps], [ahps], [conferencesToday], [appointments], [tasks], [upcoming]] = await Promise.all([
        pool.execute('SELECT COUNT(*) as count FROM receptionists'),
        pool.execute("SELECT COUNT(*) as count FROM patients WHERE status = 'active'"),
        pool.execute('SELECT COUNT(*) as count FROM gps'),
        pool.execute('SELECT COUNT(*) as count FROM allied_health_professionals'),
        pool.execute('SELECT COUNT(*) as count FROM conferences WHERE scheduled_date = ?', [today()]),
        pool.execute('SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ?', [today()]),
        pool.execute("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'"),
        pool.execute("SELECT COUNT(*) as count FROM conferences WHERE scheduled_date >= ? AND status IN ('scheduled', 'waiting', 'live')", [today()]),
      ]);
      stats = {
        receptionists: receptionists[0].count,
        patients: patients[0].count,
        gps: gps[0].count,
        ahps: ahps[0].count,
        conferencesToday: conferencesToday[0].count,
        todaysAppointments: appointments[0].count,
        pendingTasks: tasks[0].count,
        upcomingConferences: upcoming[0].count,
      };
    } else if (role === 'receptionist') {
      const [[appointments], [patients], [gps], [ahps], [conferences], [tasks], [upcoming]] = await Promise.all([
        pool.execute('SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ?', [today()]),
        pool.execute("SELECT COUNT(*) as count FROM patients WHERE status = 'active'"),
        pool.execute("SELECT COUNT(*) as count FROM gps g JOIN users u ON g.user_id = u.id WHERE u.status = 'active'"),
        pool.execute("SELECT COUNT(*) as count FROM allied_health_professionals a JOIN users u ON a.user_id = u.id WHERE u.status = 'active'"),
        pool.execute('SELECT COUNT(*) as count FROM conferences WHERE scheduled_date = ?', [today()]),
        pool.execute("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'"),
        pool.execute("SELECT COUNT(*) as count FROM conferences WHERE scheduled_date >= ? AND status IN ('scheduled', 'waiting', 'live')", [today()]),
      ]);
      stats = {
        todaysAppointments: appointments[0].count,
        patients: patients[0].count,
        availableGps: gps[0].count,
        availableAhps: ahps[0].count,
        conferences: conferences[0].count,
        upcomingConferences: upcoming[0].count,
        pendingTasks: tasks[0].count,
      };
    } else if (role === 'gp') {
      const [gpRows] = await pool.execute('SELECT id FROM gps WHERE user_id = ?', [req.user.id]);
      const gpId = gpRows[0]?.id;
      const [[patients], [conferences], [notes]] = await Promise.all([
        pool.execute('SELECT COUNT(*) as count FROM patients WHERE assigned_gp_id = ?', [gpId]),
        pool.execute('SELECT COUNT(*) as count FROM conferences WHERE gp_id = ? AND scheduled_date = ?', [gpId, today()]),
        pool.execute('SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ? AND status = ?', [req.user.id, 'pending']),
      ]);
      stats = {
        assignedPatients: patients[0].count,
        todaysConference: conferences[0].count,
        pendingNotes: notes[0].count,
      };
    } else if (role === 'ahp') {
      const [ahpRows] = await pool.execute('SELECT id FROM allied_health_professionals WHERE user_id = ?', [req.user.id]);
      const ahpId = ahpRows[0]?.id;
      const [[patients], [conferences], [reports]] = await Promise.all([
        pool.execute('SELECT COUNT(*) as count FROM patients WHERE assigned_ahp_id = ?', [ahpId]),
        pool.execute('SELECT COUNT(*) as count FROM conferences WHERE ahp_id = ? AND scheduled_date >= ?', [ahpId, today()]),
        pool.execute('SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ? AND status = ?', [req.user.id, 'pending']),
      ]);
      stats = {
        assignedPatients: patients[0].count,
        upcomingConferences: conferences[0].count,
        pendingReports: reports[0].count,
      };
    }

    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
};

exports.getTodayAppointments = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.*, CONCAT(p.first_name, ' ', p.last_name) AS patient_name
       FROM appointments a JOIN patients p ON a.patient_id = p.id
       WHERE a.appointment_date = ? ORDER BY a.appointment_time`,
      [today()]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

exports.getRecentConferences = async (req, res, next) => {
  try {
    let query = `
      SELECT c.*, CONCAT(p.first_name, ' ', p.last_name) AS patient_name
      FROM conferences c JOIN patients p ON c.patient_id = p.id`;
    const params = [];

    if (req.user.role === 'gp') {
      const [gpRows] = await pool.execute('SELECT id FROM gps WHERE user_id = ?', [req.user.id]);
      query += ' WHERE c.gp_id = ?'; params.push(gpRows[0]?.id);
    } else if (req.user.role === 'ahp') {
      const [ahpRows] = await pool.execute('SELECT id FROM allied_health_professionals WHERE user_id = ?', [req.user.id]);
      query += ' WHERE c.ahp_id = ?'; params.push(ahpRows[0]?.id);
    }

    query += ' ORDER BY c.scheduled_date DESC, c.scheduled_time DESC LIMIT 5';
    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

exports.getActivityTimeline = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT al.*, CONCAT(p.first_name, ' ', p.last_name) AS user_name
       FROM audit_logs al
       LEFT JOIN user_profiles p ON al.user_id = p.user_id
       ORDER BY al.created_at DESC LIMIT 10`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

/** Participant join-time totals for salary (admin & receptionist only). */
exports.getJoinTimeSummary = async (req, res, next) => {
  try {
    if (!['admin', 'receptionist'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Join time summary is restricted to admin and receptionist' });
    }

    const data = await getMonthlyJoinSummary();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
