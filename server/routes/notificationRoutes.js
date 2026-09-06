const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', notificationController.getAll);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/read-selected', notificationController.markSelectedRead);
router.delete('/selected', notificationController.removeSelected);
router.get('/:id', notificationController.getById);
router.patch('/:id/read', notificationController.markRead);
router.delete('/:id', notificationController.remove);

module.exports = router;
