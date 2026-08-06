const express = require('express');
const { body } = require('express-validator');
const preferencesController = require('../controllers/preferencesController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

const manageRoles = authorize('admin', 'receptionist');
const readRoles = authorize('admin', 'receptionist');

router.get('/ahp-professions', readRoles, preferencesController.getAhpProfessions);
router.post('/ahp-professions', manageRoles, [
  body('name').trim().notEmpty().withMessage('Profession name is required'),
], validate, preferencesController.createAhpProfession);
router.delete('/ahp-professions/:id', manageRoles, preferencesController.deleteAhpProfession);

module.exports = router;
