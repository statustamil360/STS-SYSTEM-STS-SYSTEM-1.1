const express = require('express');
const { body } = require('express-validator');
const patientController = require('../controllers/patientController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  canReceptionistEdit, canReceptionistDelete, requireReceptionistAction,
} = require('../middleware/receptionistPermission');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('admin', 'super_admin', 'receptionist', 'gp', 'ahp'), patientController.getAll);
router.post('/', authorize('receptionist', 'admin', 'super_admin'), requireReceptionistAction('patients_create', 'You do not have permission to add patients'), [
  body('first_name').notEmpty(), body('last_name').notEmpty(),
], validate, patientController.create);

router.get('/:id/notes', authorize('gp', 'receptionist', 'admin'), patientController.getNotes);
router.post('/:id/notes', authorize('gp'), [body('note').notEmpty()], validate, patientController.addNote);
router.get('/:id/reports', authorize('ahp', 'receptionist', 'admin'), patientController.getReports);
router.post('/:id/reports', authorize('ahp'), [body('report_content').notEmpty()], validate, patientController.addReport);

router.get('/:id', authorize('admin', 'super_admin', 'receptionist', 'gp', 'ahp'), patientController.getById);
router.put('/:id', authorize('receptionist', 'admin', 'super_admin'), canReceptionistEdit, requireReceptionistAction('patients_edit', 'You do not have permission to edit patients'), patientController.update);
router.delete('/:id', authorize('receptionist', 'admin', 'super_admin'), canReceptionistDelete, requireReceptionistAction('patients_delete', 'You do not have permission to delete patients'), patientController.remove);

module.exports = router;
