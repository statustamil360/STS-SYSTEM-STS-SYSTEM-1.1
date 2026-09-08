const pool = require('../config/db');
const { getMonthlyJoinSummary } = require('../services/conferenceAttendanceService');

const num = (value) => Number(value) || 0;

const participantExistsSql = `EXISTS (
  SELECT 1 FROM conference_participants cp
  WHERE cp.conference_id = c.id AND cp.user_id = ?
)`;

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
        totalAdmins: num(adminRows[0][0].count),
        activeUsers: num(userRows[0][0].count),
        activeConferences: num(conferenceRows[0][0].count),
        systemHealth: 'Healthy',
      };
    } else if (role === 'admin') {
      const [[receptionists], [patients], [gps], [ahps], [conferencesToday], [appointments], [tasks], [upcoming]] = await Promise.all([
        pool.execute("SELECT COUNT(*) as count FROM receptionists r JOIN users u ON r.user_id = u.id WHERE u.status = 'active'"),
        pool.execute("SELECT COUNT(*) as count FROM patients WHERE status = 'active'"),
        pool.execute("SELECT COUNT(*) as count FROM gps g JOIN users u ON g.user_id = u.id WHERE u.status = 'active'"),
        pool.execute("SELECT COUNT(*) as count FROM allied_health_professionals a JOIN users u ON a.user_id = u.id WHERE u.status = 'active'"),
        pool.execute('SELECT COUNT(*) as count FROM conferences WHERE scheduled_date = CURDATE()'),
        pool.execute('SELECT COUNT(*) as count FROM appointments WHERE appointment_date = CURDATE()'),
        pool.execute("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'"),
        pool.execute("SELECT COUNT(*) as count FROM conferences WHERE scheduled_date >= CURDATE() AND status IN ('scheduled', 'waiting', 'live')"),
      ]);
      stats = {
        receptionists: num(receptionists[0].count),
        patients: num(patients[0].count),
        gps: num(gps[0].count),
        ahps: num(ahps[0].count),
        conferencesToday: num(conferencesToday[0].count),
        todaysAppointments: num(appointments[0].count),
        pendingTasks: num(tasks[0].count),
        upcomingConferences: num(upcoming[0].count),
      };
    } else if (role === 'receptionist') {
      const [[appointments], [patients], [gps], [ahps], [conferences], [tasks], [upcoming]] = await Promise.all([
        pool.execute('SELECT COUNT(*) as count FROM appointments WHERE appointment_date = CURDATE()'),
        pool.execute("SELECT COUNT(*) as count FROM patients WHERE status = 'active'"),
        pool.execute("SELECT COUNT(*) as count FROM gps g JOIN users u ON g.user_id = u.id WHERE u.status = 'active'"),
        pool.execute("SELECT COUNT(*) as count FROM allied_health_professionals a JOIN users u ON a.user_id = u.id WHERE u.status = 'active'"),
        pool.execute('SELECT COUNT(*) as count FROM conferences WHERE scheduled_date = CURDATE()'),
        pool.execute("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'"),
        pool.execute("SELECT COUNT(*) as count FROM conferences WHERE scheduled_date >= CURDATE() AND status IN ('scheduled', 'waiting', 'live')"),
      ]);
      stats = {
        todaysAppointments: num(appointments[0].count),
        patients: num(patients[0].count),
        availableGps: num(gps[0].count),
        availableAhps: num(ahps[0].count),
        conferences: num(conferences[0].count),
        upcomingConferences: num(upcoming[0].count),
        pendingTasks: num(tasks[0].count),
      };
    } else if (role === 'gp') {
      const [gpRows] = await pool.execute('SELECT id FROM gps WHERE user_id = ?', [req.user.id]);
      const gpId = gpRows[0]?.id ?? 0;
      const [[patients], [conferences], [notes]] = await Promise.all([
        pool.execute(
          `SELECT COUNT(DISTINCT pat.id) AS count
           FROM patients pat
           WHERE pat.assigned_gp_id = ?
              OR EXISTS (
                SELECT 1 FROM conference_participants cp
                JOIN conferences c ON c.id = cp.conference_id
                WHERE cp.user_id = ? AND c.patient_id = pat.id
              )`,
          [gpId, req.user.id]
        ),
        pool.execute(
          `SELECT COUNT(*) as count FROM conferences c
           WHERE c.scheduled_date = CURDATE()
             AND c.status IN ('scheduled', 'waiting', 'live', 'completed')
             AND (c.gp_id = ? OR ${participantExistsSql})`,
          [gpId, req.user.id]
        ),
        pool.execute(
          `SELECT COUNT(*) as count FROM conference_clinical_reports r
           JOIN conferences c ON c.id = r.conference_id
           WHERE r.user_id = ?
             AND c.scheduled_date = CURDATE()
             AND (r.assessment IS NULL OR r.assessment = '' OR r.assessment = '<p></p>')`,
          [req.user.id]
        ),
      ]);
      stats = {
        assignedPatients: num(patients[0].count),
        todaysConference: num(conferences[0].count),
        pendingNotes: num(notes[0].count),
      };
    } else if (role === 'ahp') {
      const [ahpRows] = await pool.execute('SELECT id FROM allied_health_professionals WHERE user_id = ?', [req.user.id]);
      const ahpId = ahpRows[0]?.id ?? 0;
      const [[patients], [conferences], [reports]] = await Promise.all([
        pool.execute(
          `SELECT COUNT(DISTINCT pat.id) AS count
           FROM patients pat
           WHERE pat.assigned_ahp_id = ?
              OR EXISTS (
                SELECT 1 FROM conference_participants cp
                JOIN conferences c ON c.id = cp.conference_id
                WHERE cp.user_id = ? AND c.patient_id = pat.id
              )`,
          [ahpId, req.user.id]
        ),
        pool.execute(
          `SELECT COUNT(*) as count FROM conferences c
           WHERE c.scheduled_date >= CURDATE()
             AND c.status IN ('scheduled', 'waiting', 'live')
             AND (c.ahp_id = ? OR ${participantExistsSql})`,
          [ahpId, req.user.id]
        ),
        pool.execute(
          `SELECT COUNT(*) as count FROM conference_clinical_reports r
           JOIN conferences c ON c.id = r.conference_id
           WHERE r.user_id = ?
             AND c.status IN ('waiting', 'live', 'completed')
             AND (r.recommendations IS NULL OR r.recommendations = '' OR r.recommendations = '<p></p>')`,
          [req.user.id]
        ),
      ]);
      stats = {
        assignedPatients: num(patients[0].count),
        upcomingConferences: num(conferences[0].count),
        pendingReports: num(reports[0].count),
      };
    }

    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
};

exports.getTodayAppointments = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.id, a.status,
              TIME_FORMAT(a.appointment_time, '%H:%i:%s') AS appointment_time,
              CONCAT(p.first_name, ' ', p.last_name) AS patient_name
       FROM appointments a JOIN patients p ON a.patient_id = p.id
       WHERE a.appointment_date = CURDATE()
       ORDER BY a.appointment_time`,
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

exports.getRecentConferences = async (req, res, next) => {
  try {
    let query = `
      SELECT c.id, c.conference_code, c.status,
             DATE_FORMAT(c.scheduled_date, '%Y-%m-%d') AS scheduled_date,
             TIME_FORMAT(c.scheduled_time, '%H:%i:%s') AS scheduled_time,
             CONCAT(p.first_name, ' ', p.last_name) AS patient_name
      FROM conferences c JOIN patients p ON c.patient_id = p.id`;
    const params = [];

    if (req.user.role === 'gp') {
      const [gpRows] = await pool.execute('SELECT id FROM gps WHERE user_id = ?', [req.user.id]);
      query += ` WHERE (c.gp_id = ? OR EXISTS (
        SELECT 1 FROM conference_participants cp
        WHERE cp.conference_id = c.id AND cp.user_id = ?
      ))`;
      params.push(gpRows[0]?.id ?? 0, req.user.id);
    } else if (req.user.role === 'ahp') {
      const [ahpRows] = await pool.execute('SELECT id FROM allied_health_professionals WHERE user_id = ?', [req.user.id]);
      query += ` WHERE (c.ahp_id = ? OR EXISTS (
        SELECT 1 FROM conference_participants cp
        WHERE cp.conference_id = c.id AND cp.user_id = ?
      ))`;
      params.push(ahpRows[0]?.id ?? 0, req.user.id);
    }

    query += ' ORDER BY c.scheduled_date DESC, c.scheduled_time DESC LIMIT 5';
    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

exports.getActivityTimeline = async (req, res, next) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const [rows] = await pool.execute(
      `SELECT al.id, al.action, al.entity_type, al.details,
              DATE_FORMAT(al.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
              CONCAT(p.first_name, ' ', p.last_name) AS user_name
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
