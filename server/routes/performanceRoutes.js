const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const performanceController = require('../controllers/performanceController');

const router = express.Router();

router.use(authenticate);
router.use(authorize('super_admin', 'admin'));

router.get('/metrics', performanceController.getMetrics);
router.get('/stream', authorize('super_admin'), performanceController.getDbStream);

module.exports = router;
