const express = require('express');
const auditController = require('../controllers/auditController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, authorize('super_admin'));

router.get('/', auditController.getAll);
router.get('/login-history', auditController.getLoginHistory);
router.get('/export', auditController.exportLogs);

module.exports = router;
