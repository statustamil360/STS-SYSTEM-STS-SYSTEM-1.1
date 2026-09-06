const express = require('express');
const { body } = require('express-validator');
const taskController = require('../controllers/taskController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  canReceptionistEdit, canReceptionistDelete, requireReceptionistAction,
} = require('../middleware/receptionistPermission');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');

const router = express.Router();
router.use(authenticate);

const taskRoles = ['receptionist', 'gp', 'ahp', 'admin', 'super_admin'];

router.get('/unread-count', authorize(...taskRoles), taskController.getUnreadCount);
router.post('/inbox/read', authorize(...taskRoles), taskController.markInboxRead);
router.post('/:id/assigner-read', authorize(...taskRoles), taskController.markAssignerRead);
router.get('/', authorize(...taskRoles), taskController.getAll);
router.get('/:id/files/:fileId/view', authorize(...taskRoles), taskController.viewFile);
router.get('/:id', authorize(...taskRoles), taskController.getById);
router.post('/', authorize('receptionist', 'gp', 'ahp', 'admin'), requireReceptionistAction('tasks_create', 'You do not have permission to add tasks'), upload.array('files', 20), [
  body('title').notEmpty(), body('assigned_to').isInt(),
], validate, taskController.create);
router.put('/:id', authorize('receptionist', 'gp', 'ahp', 'admin'), canReceptionistEdit, requireReceptionistAction('tasks_edit', 'You do not have permission to edit tasks'), upload.array('files', 20), taskController.update);
router.delete('/:id/files/:fileId', authorize('receptionist', 'gp', 'ahp', 'admin'), canReceptionistDelete, requireReceptionistAction('tasks_delete', 'You do not have permission to delete tasks'), taskController.removeFile);
router.delete('/:id', authorize('receptionist', 'gp', 'ahp', 'admin'), canReceptionistDelete, requireReceptionistAction('tasks_delete', 'You do not have permission to delete tasks'), taskController.remove);

module.exports = router;
