const express = require('express');
const { body } = require('express-validator');
const appointmentController = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  canReceptionistEdit, canReceptionistDelete, requireReceptionistAction,
} = require('../middleware/receptionistPermission');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { parseGpIds } = require('../utils/appointmentAssignments');

const router = express.Router();
router.use(authenticate, authorize('receptionist', 'admin', 'super_admin'));

router.get('/', appointmentController.getAll);
router.get('/:id/files/:fileId/view', appointmentController.viewFile);
router.get('/:id', appointmentController.getById);
router.post('/', requireReceptionistAction('appointments_create', 'You do not have permission to add appointments'), upload.array('files', 20), [
  body('patient_id').toInt().isInt({ min: 1 }).withMessage('Patient is required'),
  body('gp_ids').custom((_value, { req }) => {
    if (!parseGpIds(req.body).length) throw new Error('At least one GP is required');
    return true;
  }),
  body('appointment_date').notEmpty().withMessage('Date is required'),
  body('appointment_time').notEmpty().withMessage('Time is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
], validate, appointmentController.create);
const canEditAppointment = requireReceptionistAction('appointments_edit', 'You do not have permission to edit appointments');
const canDeleteAppointment = requireReceptionistAction('appointments_delete', 'You do not have permission to delete appointments');

router.put('/:id', canReceptionistEdit, canEditAppointment, upload.array('files', 20), appointmentController.update);
router.delete('/:id/files/:fileId', canReceptionistDelete, canDeleteAppointment, appointmentController.removeFile);
router.delete('/:id', canReceptionistDelete, canDeleteAppointment, appointmentController.remove);

module.exports = router;
