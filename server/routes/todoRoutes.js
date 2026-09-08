const express = require('express');
const { body } = require('express-validator');
const todoController = require('../controllers/todoController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

const todoRoles = ['super_admin', 'admin', 'receptionist', 'gp', 'ahp'];

router.get('/', authorize(...todoRoles), todoController.getAll);
router.post('/', authorize(...todoRoles), [
  body('title').trim().notEmpty().withMessage('Please enter a to-do'),
], validate, todoController.create);
router.put('/:id', authorize(...todoRoles), todoController.update);
router.delete('/:id', authorize(...todoRoles), todoController.remove);

module.exports = router;
