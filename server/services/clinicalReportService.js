const pool = require('../config/db');

const EDIT_WINDOW_MS = 60 * 60 * 1000;

const isClinicalRole = (role) => ['gp', 'ahp', 'conference_guest'].includes(role);

const mapParticipantRole = (userRole, guestRole) => {
  if (userRole === 'gp') return 'gp';
  if (userRole === 'ahp') return 'ahp';
  if (guestRole === 'guest_gp') return 'guest_gp';
  if (guestRole === 'guest_ahp') return 'guest_ahp';
  return 'guest_ahp';
};

const getDisplayName = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))) AS name
     FROM user_profiles WHERE user_id = ?`,
    [userId]
  );
  return rows[0]?.name?.trim() || 'Participant';
};

const isConferenceParticipant = async (conferenceId, userId, userRole) => {
  const [conference] = await pool.execute('SELECT gp_id, ahp_id, status FROM conferences WHERE id = ?', [conferenceId]);
  if (!conference.length) return { ok: false, message: 'Conference not found' };

  if (['receptionist', 'admin', 'super_admin'].includes(userRole)) {
    return { ok: true, conference: conference[0], canWrite: false, isAssignedGp: false };
  }

  if (userRole === 'gp') {
    const [gp] = await pool.execute('SELECT id FROM gps WHERE user_id = ?', [userId]);
    if (!gp.length) return { ok: false };
    const isPrimary = conference[0].gp_id === gp[0].id;
    const [cp] = await pool.execute(
      'SELECT id FROM conference_participants WHERE conference_id = ? AND user_id = ?',
      [conferenceId, userId]
    );
    const isAssigned = isPrimary || cp.length > 0;
    return { ok: isAssigned, conference: conference[0], canWrite: isAssigned, isAssignedGp: isAssigned };
  }

  if (userRole === 'ahp') {
    const [ahp] = await pool.execute('SELECT id FROM allied_health_professionals WHERE user_id = ?', [userId]);
    if (!ahp.length) return { ok: false };
    const ahpId = ahp[0].id;
    const isPrimary = conference[0].ahp_id === ahpId;
    const [cp] = await pool.execute(
      'SELECT id FROM conference_participants WHERE conference_id = ? AND user_id = ?',
      [conferenceId, userId]
    );
    const ok = isPrimary || cp.length > 0;
    return { ok, conference: conference[0], canWrite: ok, isAssignedGp: false };
  }

  if (userRole === 'conference_guest') {
    const [guest] = await pool.execute(
      `SELECT guest_role FROM conference_guest_access
       WHERE conference_id = ? AND user_id = ? AND revoked_at IS NULL AND expires_at > NOW()`,
      [conferenceId, userId]
    );
    if (!guest.length) return { ok: false };
    return {
      ok: true,
      conference: conference[0],
      canWrite: true,
      isAssignedGp: false,
      guestRole: guest[0].guest_role,
    };
  }

  return { ok: false };
};

const canEditReport = async (conferenceId, userId, userRole) => {
  const access = await isConferenceParticipant(conferenceId, userId, userRole);
  if (!access.ok) return { allowed: false, reason: 'Not a participant' };

  const [confRows] = await pool.execute(
    'SELECT status, ended_at FROM conferences WHERE id = ?',
    [conferenceId]
  );
  const conf = confRows[0];
  if (!conf) return { allowed: false, reason: 'Conference not found' };

  if (['scheduled', 'cancelled'].includes(conf.status)) {
    return { allowed: false, reason: 'Conference not active' };
  }

  if (conf.status === 'completed' && conf.ended_at) {
    const endedAt = new Date(conf.ended_at).getTime();
    if (Date.now() - endedAt > EDIT_WINDOW_MS) {
      const [req] = await pool.execute(
        `SELECT id FROM conference_report_edit_requests
         WHERE conference_id = ? AND user_id = ? AND status = 'approved'
         ORDER BY reviewed_at DESC LIMIT 1`,
        [conferenceId, userId]
      );
      if (!req.length) {
        return { allowed: false, reason: 'Edit window expired. Request access from receptionist.' };
      }
    }
  }

  return { allowed: true, access };
};

const ensureReportRows = async (conferenceId) => {
  const [participants] = await pool.execute(
    `SELECT cp.user_id, cp.role_in_conference AS role, u.email
     FROM conference_participants cp
     JOIN users u ON u.id = cp.user_id
     WHERE cp.conference_id = ? AND cp.role_in_conference IN ('gp', 'ahp')`,
    [conferenceId]
  );

  const [guests] = await pool.execute(
    `SELECT user_id, guest_role, guest_name FROM conference_guest_access
     WHERE conference_id = ? AND user_id IS NOT NULL AND revoked_at IS NULL`,
    [conferenceId]
  );

  const all = [
    ...participants.map((p) => ({
      userId: p.user_id,
      role: p.role === 'gp' ? 'gp' : 'ahp',
      displayName: null,
    })),
    ...guests.map((g) => ({
      userId: g.user_id,
      role: g.guest_role,
      displayName: g.guest_name,
    })),
  ];

  for (const p of all) {
    const displayName = p.displayName || await getDisplayName(p.userId);
    await pool.execute(
      `INSERT IGNORE INTO conference_clinical_reports
       (conference_id, user_id, participant_role, display_name)
       VALUES (?, ?, ?, ?)`,
      [conferenceId, p.userId, p.role, displayName]
    );
  }
};

const listReports = async (conferenceId) => {
  await ensureReportRows(conferenceId);
  const [rows] = await pool.execute(
    `SELECT id, conference_id, user_id, participant_role, display_name,
            assessment, recommendations, conclusion, edit_locked_at, updated_at
     FROM conference_clinical_reports WHERE conference_id = ?
     ORDER BY FIELD(participant_role, 'gp', 'guest_gp', 'ahp', 'guest_ahp'), display_name`,
    [conferenceId]
  );
  return rows;
};

const getReportByUser = async (conferenceId, userId) => {
  const [rows] = await pool.execute(
    `SELECT * FROM conference_clinical_reports WHERE conference_id = ? AND user_id = ?`,
    [conferenceId, userId]
  );
  return rows[0] || null;
};

const upsertReportSection = async ({
  conferenceId,
  userId,
  userRole,
  targetUserId,
  section,
  content,
}) => {
  const editCheck = await canEditReport(conferenceId, userId, userRole);
  if (!editCheck.allowed) {
    const err = new Error(editCheck.reason);
    err.statusCode = 403;
    throw err;
  }

  const allowedSections = ['assessment', 'recommendations', 'conclusion'];
  if (!allowedSections.includes(section)) {
    const err = new Error('Invalid section');
    err.statusCode = 400;
    throw err;
  }

  await ensureReportRows(conferenceId);
  const targetId = targetUserId || userId;

  let report = await getReportByUser(conferenceId, targetId);
  if (!report) {
    const displayName = await getDisplayName(targetId);
    const guestRole = editCheck.access?.guestRole;
    const participantRole = mapParticipantRole(
      targetId === userId ? userRole : 'gp',
      guestRole
    );
    await pool.execute(
      `INSERT INTO conference_clinical_reports
       (conference_id, user_id, participant_role, display_name)
       VALUES (?, ?, ?, ?)`,
      [conferenceId, targetId, participantRole, displayName]
    );
    report = await getReportByUser(conferenceId, targetId);
  }

  await pool.execute(
    `UPDATE conference_clinical_reports SET ${section} = ?, updated_at = NOW() WHERE id = ?`,
    [content, report.id]
  );

  const [updated] = await pool.execute(
    'SELECT * FROM conference_clinical_reports WHERE id = ?',
    [report.id]
  );
  return updated[0];
};

const lockReportsAfterMeeting = async (conferenceId) => {
  const lockAt = new Date(Date.now() + EDIT_WINDOW_MS);
  await pool.execute(
    `UPDATE conference_clinical_reports SET edit_locked_at = ? WHERE conference_id = ?`,
    [lockAt, conferenceId]
  );
};

module.exports = {
  EDIT_WINDOW_MS,
  isClinicalRole,
  isConferenceParticipant,
  canEditReport,
  ensureReportRows,
  listReports,
  getReportByUser,
  upsertReportSection,
  lockReportsAfterMeeting,
  getDisplayName,
};
