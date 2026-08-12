const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/stats', dashboardController.getStats);
router.get('/appointments/today', dashboardController.getTodayAppointments);
router.get('/conferences/recent', dashboardController.getRecentConferences);
router.get('/activity', dashboardController.getActivityTimeline);
router.get('/join-time-summary', dashboardController.getJoinTimeSummary);

module.exports = router;
