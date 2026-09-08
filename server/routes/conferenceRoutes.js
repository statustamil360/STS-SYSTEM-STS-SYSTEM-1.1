const express = require('express');
const { body } = require('express-validator');
const conferenceController = require('../controllers/conferenceController');
const conferenceReportController = require('../controllers/conferenceReportController');
const conferenceGuestController = require('../controllers/conferenceGuestController');
const recordingController = require('../controllers/recordingController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  canReceptionistEdit, canReceptionistDelete, requireReceptionistAction,
} = require('../middleware/receptionistPermission');
const validate = require('../middleware/validate');

const router = express.Router();

const clinicalRoles = ['receptionist', 'gp', 'ahp', 'admin', 'super_admin', 'conference_guest'];

const canViewDocuments = requireReceptionistAction('documents_view', 'You do not have permission to view conference documents');
const canExportReports = requireReceptionistAction('reports_export', 'You do not have permission to export meeting reports');

router.get('/guest/info', conferenceGuestController.guestLoginInfo);

router.use(authenticate);

router.get('/join-time-report/export', authorize('receptionist', 'admin'), canExportReports, conferenceController.exportJoinTimeReport);
router.get('/join-time-report', authorize('receptionist', 'admin'), conferenceController.getJoinTimeReport);
router.get('/today', authorize(...clinicalRoles), conferenceController.getSchedule);
router.get('/schedule', authorize(...clinicalRoles), conferenceController.getSchedule);
router.get('/documents', authorize(...clinicalRoles), canViewDocuments, conferenceController.getDocuments);
router.get('/export', authorize('receptionist', 'gp', 'ahp', 'admin', 'super_admin'), canExportReports, conferenceController.exportReport);
router.get('/', authorize(...clinicalRoles), conferenceController.getAll);

router.get('/:id/reports', authorize('gp', 'ahp', 'conference_guest', 'receptionist', 'admin', 'super_admin'), conferenceReportController.getReports);
router.get('/:id/reports/edit-status', authorize('gp', 'ahp', 'conference_guest'), conferenceReportController.getEditStatus);
router.put('/:id/reports', authorize('gp', 'ahp', 'conference_guest'), [
  body('section').isIn(['assessment', 'recommendations', 'conclusion']),
  body('content').isString(),
], validate, conferenceReportController.updateReportSection);
router.post('/:id/reports/edit-request', authorize('gp', 'ahp', 'conference_guest'), conferenceReportController.requestEditAccess);
router.patch('/:id/reports/edit-requests/:requestId', authorize('receptionist', 'admin', 'super_admin'), conferenceReportController.reviewEditRequest);

router.get('/:id/guests', authorize('receptionist'), conferenceGuestController.listGuests);
router.get('/:id/guests/:guestId/credentials', authorize('receptionist'), conferenceGuestController.getGuestCredentials);
router.post('/:id/guests/:guestId/reset-password', authorize('receptionist'), conferenceGuestController.resetGuestPassword);
router.post('/:id/guests', authorize('receptionist'), [
  body('guest_name').notEmpty(),
  body('guest_email').isEmail(),
  body('guest_role').isIn(['guest_gp', 'guest_ahp']),
], validate, conferenceGuestController.createGuest);
router.delete('/:id/guests/:guestId', authorize('receptionist'), conferenceGuestController.revokeGuest);

router.get('/:id/documents/:fileId/view', authorize(...clinicalRoles), canViewDocuments, conferenceController.viewGeneratedDocument);
router.get('/:id/files/:fileId/view', authorize(...clinicalRoles), conferenceController.viewDocument);
router.get('/:id/clinical-context', authorize(...clinicalRoles), conferenceController.getClinicalContext);
router.get('/:id', authorize(...clinicalRoles), conferenceController.getById);
router.post('/', authorize('receptionist'), [
  body('patient_id').isInt(), body('scheduled_date').notEmpty(), body('scheduled_time').notEmpty(),
], validate, conferenceController.create);
router.post('/:id/accept', authorize('receptionist', 'admin', 'super_admin'), requireReceptionistAction('conference_open', 'You do not have permission to open meetings'), conferenceController.accept);
router.post('/:id/join', authorize('gp', 'ahp', 'conference_guest'), conferenceController.join);
router.post('/:id/leave', authorize('gp', 'ahp', 'conference_guest', 'receptionist', 'admin', 'super_admin'), conferenceController.leave);
router.post('/:id/recording-chunks', authorize('gp', 'ahp', 'conference_guest', 'receptionist', 'admin', 'super_admin'), recordingController.uploadChunk);
router.get('/:id/participants', authorize(...clinicalRoles), conferenceController.getParticipants);
router.get('/:id/attendance', authorize('receptionist', 'admin', 'super_admin'), conferenceController.getAttendance);
router.post('/:id/end', authorize('receptionist', 'admin', 'super_admin'), requireReceptionistAction('conference_end', 'You do not have permission to end meetings'), conferenceController.end);
router.post('/:id/continue-empty', authorize('receptionist', 'admin', 'super_admin'), requireReceptionistAction('conference_end', 'You do not have permission to manage this meeting'), conferenceController.continueEmpty);
router.put('/:id', authorize('receptionist', 'gp', 'ahp'), canReceptionistEdit, conferenceController.update);
router.delete('/:id', authorize('receptionist'), canReceptionistDelete, conferenceController.remove);

module.exports = router;
