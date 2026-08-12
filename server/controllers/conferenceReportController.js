const pool = require('../config/db');
const {
  listReports,
  upsertReportSection,
  canEditReport,
  isConferenceParticipant,
} = require('../services/clinicalReportService');
const { emitReportUpdate } = require('../services/socketService');
const { createAuditLog } = require('../middleware/auditLog');

exports.getReports = async (req, res, next) => {
  try {
    const access = await isConferenceParticipant(req.params.id, req.user.id, req.user.role);
    if (!access.ok && !['receptionist', 'admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const reports = await listReports(req.params.id);
    res.json({ success: true, data: reports });
  } catch (err) { next(err); }
};

exports.updateReportSection = async (req, res, next) => {
  try {
    const { section, content, targetUserId } = req.body;
    const report = await upsertReportSection({
      conferenceId: req.params.id,
      userId: req.user.id,
      userRole: req.user.role,
      targetUserId: targetUserId ? Number(targetUserId) : req.user.id,
      section,
      content,
    });

    emitReportUpdate(req.params.id, report, { id: req.user.id, role: req.user.role });

    res.json({ success: true, data: report });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    next(err);
  }
};

exports.requestEditAccess = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) {
      return res.status(400).json({ success: false, message: 'Reason is required' });
    }

    const access = await isConferenceParticipant(req.params.id, req.user.id, req.user.role);
    if (!access.ok) {
      return res.status(403).json({ success: false, message: 'Not a participant' });
    }

    await pool.execute(
      `INSERT INTO conference_report_edit_requests (conference_id, user_id, reason)
       VALUES (?, ?, ?)`,
      [req.params.id, req.user.id, reason.trim()]
    );

    const [receptionists] = await pool.execute(
      `SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'receptionist' AND u.status = 'active'`
    );
    for (const r of receptionists) {
      await pool.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [r.id, 'Report Edit Request', `A participant requested to edit a completed conference report`, 'conference']
      );
    }

    res.json({ success: true, message: 'Edit request submitted to receptionist' });
  } catch (err) { next(err); }
};

exports.reviewEditRequest = async (req, res, next) => {
  try {
    if (!['receptionist', 'admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    await pool.execute(
      `UPDATE conference_report_edit_requests
       SET status = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ? AND conference_id = ?`,
      [status, req.user.id, req.params.requestId, req.params.id]
    );

    if (status === 'approved') {
      await pool.execute(
        'UPDATE conference_clinical_reports SET edit_locked_at = NULL WHERE conference_id = ?',
        [req.params.id]
      );
    }

    await createAuditLog({
      userId: req.user.id,
      action: 'report_edit_request_review',
      entityType: 'conference',
      entityId: parseInt(req.params.id, 10),
      ipAddress: req.ip,
    });

    res.json({ success: true, message: `Request ${status}` });
  } catch (err) { next(err); }
};

exports.getEditStatus = async (req, res, next) => {
  try {
    const editCheck = await canEditReport(req.params.id, req.user.id, req.user.role);
    const [conf] = await pool.execute(
      'SELECT status, ended_at FROM conferences WHERE id = ?',
      [req.params.id]
    );
    res.json({
      success: true,
      data: {
        canEdit: editCheck.allowed,
        reason: editCheck.reason || null,
        status: conf[0]?.status,
        endedAt: conf[0]?.ended_at,
      },
    });
  } catch (err) { next(err); }
};
