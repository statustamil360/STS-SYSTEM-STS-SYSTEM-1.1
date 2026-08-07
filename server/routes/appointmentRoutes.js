const express = require('express');
const { body } = require('express-validator');
const appointmentController = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');

const router = express.Router();
router.use(authenticate, authorize('receptionist', 'admin', 'super_admin'));

router.get('/', appointmentController.getAll);
router.get('/:id/files/:fileId/view', appointmentController.viewFile);
router.get('/:id', appointmentController.getById);
router.post('/', upload.array('files', 20), [
  body('patient_id').toInt().isInt({ min: 1 }).withMessage('Patient is required'),
  body('gp_id').toInt().isInt({ min: 1 }).withMessage('GP is required'),
  body('appointment_date').notEmpty().withMessage('Date is required'),
  body('appointment_time').notEmpty().withMessage('Time is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
], validate, appointmentController.create);
router.put('/:id', upload.array('files', 20), appointmentController.update);
router.delete('/:id/files/:fileId', appointmentController.removeFile);
router.delete('/:id', appointmentController.remove);

module.exports = router;
