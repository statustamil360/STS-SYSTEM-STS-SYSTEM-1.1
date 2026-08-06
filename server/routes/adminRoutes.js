const express = require('express');
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('super_admin'), adminController.getAll);
router.get('/:id', authorize('super_admin'), adminController.getById);
router.post('/', authorize('super_admin'), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').optional({ nullable: true }).matches(/^\+?[\d\s-]{8,15}$/).withMessage('Invalid phone number'),
  body('status').optional().isIn(['active', 'inactive']),
], validate, adminController.create);
router.put('/:id', authorize('super_admin'), adminController.update);
router.patch('/:id/password', authorize('super_admin'), [
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], validate, adminController.resetPassword);
router.patch('/:id/status', authorize('super_admin'), adminController.toggleStatus);
router.delete('/:id', authorize('super_admin'), adminController.remove);

module.exports = router;
