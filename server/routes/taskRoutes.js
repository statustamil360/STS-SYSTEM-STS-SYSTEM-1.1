const express = require('express');
const { body } = require('express-validator');
const taskController = require('../controllers/taskController');
const { authenticate, authorize } = require('../middleware/auth');
const { canReceptionistEdit, canReceptionistDelete } = require('../middleware/receptionistPermission');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('receptionist', 'gp', 'ahp', 'admin', 'super_admin'), taskController.getAll);
router.post('/', authorize('receptionist', 'gp', 'ahp', 'admin'), [
  body('title').notEmpty(), body('assigned_to').isInt(),
], validate, taskController.create);
router.put('/:id', authorize('receptionist', 'gp', 'ahp', 'admin'), canReceptionistEdit, taskController.update);
router.delete('/:id', authorize('receptionist', 'admin'), canReceptionistDelete, taskController.remove);

module.exports = router;
