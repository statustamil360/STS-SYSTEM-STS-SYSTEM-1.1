const express = require('express');
const { body } = require('express-validator');
const staffController = require('../controllers/staffController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  canReceptionistEdit, canReceptionistDelete, requireReceptionistAction,
} = require('../middleware/receptionistPermission');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

router.get('/assignable-users', authorize('receptionist', 'admin', 'gp', 'ahp', 'super_admin'), staffController.getAssignableUsers);

router.get('/receptionists', authorize('admin', 'super_admin'), staffController.getAll);
router.post('/receptionists', authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').notEmpty().withMessage('Phone is required').matches(/^\+?[\d\s-]{8,15}$/).withMessage('Invalid phone number'),
  body('date_of_birth').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid date of birth'),
  body('gender').optional({ values: 'falsy' }).isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('nic').optional({ values: 'falsy' }).trim().isLength({ max: 50 }),
  body('address').optional({ values: 'falsy' }).trim(),
  body('emergency_contact').optional({ values: 'falsy' }).trim().isLength({ max: 100 }),
  body('status').optional().isIn(['active', 'inactive']),
  body('permissions').optional().isObject().withMessage('Permissions must be an object'),
], validate, staffController.create);
router.put('/receptionists/:id', authorize('admin', 'super_admin'), [
  body('status').optional().isIn(['active', 'inactive', 'disabled']),
  body('permissions').optional().isObject().withMessage('Permissions must be an object'),
], validate, staffController.update);
router.patch('/receptionists/:id/password', authorize('admin', 'super_admin'), [
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], validate, staffController.resetReceptionistPassword);
router.delete('/receptionists/:id', authorize('admin', 'super_admin'), staffController.remove);

router.get('/gps', authorize('admin', 'super_admin', 'receptionist'), staffController.getAllGPs);
router.post('/gps', authorize('receptionist', 'admin'), requireReceptionistAction('gps_create', 'You do not have permission to add GPs'), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('status').optional().isIn(['active', 'inactive']),
], validate, staffController.createGP);
router.put('/gps/:id', authorize('receptionist', 'admin'), canReceptionistEdit, requireReceptionistAction('gps_edit', 'You do not have permission to edit GPs'), staffController.updateGP);
router.patch('/gps/:id/password', authorize('admin', 'super_admin'), [
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], validate, staffController.resetGPPassword);
router.delete('/gps/:id', authorize('receptionist', 'admin'), canReceptionistDelete, requireReceptionistAction('gps_delete', 'You do not have permission to delete GPs'), staffController.removeGP);

router.get('/ahps', authorize('admin', 'super_admin', 'receptionist'), staffController.getAllAHPs);
router.post('/ahps', authorize('receptionist', 'admin'), requireReceptionistAction('ahps_create', 'You do not have permission to add AHPs'), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('status').optional().isIn(['active', 'inactive']),
], validate, staffController.createAHP);
router.put('/ahps/:id', authorize('receptionist', 'admin'), canReceptionistEdit, requireReceptionistAction('ahps_edit', 'You do not have permission to edit AHPs'), staffController.updateAHP);
router.patch('/ahps/:id/password', authorize('admin', 'super_admin'), [
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], validate, staffController.resetAHPPassword);
router.delete('/ahps/:id', authorize('receptionist', 'admin'), canReceptionistDelete, requireReceptionistAction('ahps_delete', 'You do not have permission to delete AHPs'), staffController.removeAHP);

module.exports = router;
