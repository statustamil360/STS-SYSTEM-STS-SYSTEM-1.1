const express = require('express');
const settingsController = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/public', settingsController.getPublic);
router.get('/', authorize('super_admin', 'admin'), settingsController.getAll);
router.put('/', authorize('super_admin', 'admin'), settingsController.update);

module.exports = router;
