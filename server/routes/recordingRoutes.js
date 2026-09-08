const express = require('express');
const recordingController = require('../controllers/recordingController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.get('/', authorize('admin', 'super_admin'), recordingController.list);
router.get('/:id/stream', authorize('admin', 'super_admin'), recordingController.stream);
router.get('/:id/download', authorize('admin', 'super_admin'), recordingController.download);
router.get('/:id', authorize('admin', 'super_admin'), recordingController.getById);

module.exports = router;
