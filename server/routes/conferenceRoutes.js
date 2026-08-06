const express = require('express');
const { body } = require('express-validator');
const conferenceController = require('../controllers/conferenceController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

const clinicalRoles = ['receptionist', 'gp', 'ahp', 'admin', 'super_admin'];

router.get('/today', authorize(...clinicalRoles), conferenceController.getToday);
router.get('/', authorize(...clinicalRoles), conferenceController.getAll);
router.get('/:id', authorize(...clinicalRoles), conferenceController.getById);
router.post('/', authorize('receptionist'), [
  body('patient_id').isInt(), body('scheduled_date').notEmpty(), body('scheduled_time').notEmpty(),
], validate, conferenceController.create);
router.post('/:id/accept', authorize('gp'), conferenceController.accept);
router.post('/:id/join', authorize('gp', 'ahp'), conferenceController.join);
router.post('/:id/end', authorize('gp'), conferenceController.end);
router.put('/:id', authorize('receptionist', 'gp', 'ahp'), conferenceController.update);
router.delete('/:id', authorize('receptionist'), conferenceController.remove);

module.exports = router;
