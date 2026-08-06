const express = require('express');
const { body } = require('express-validator');
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(authenticate, authorize('super_admin', 'admin'));

router.post('/generate', [
  body('report_type').isIn(['conference', 'patient', 'gp', 'ahp', 'activity', 'login']),
], validate, reportController.generate);
router.get('/history', reportController.getHistory);

module.exports = router;
