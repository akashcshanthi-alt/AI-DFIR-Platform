const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// Self profile actions
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.put('/profile/password', authenticate, userController.changePassword);

// Administrative actions (Super Admin and Admin roles only)
router.get('/', authenticate, authorizeRoles('Super Admin', 'Admin'), userController.getUsers);
router.get('/:id', authenticate, authorizeRoles('Super Admin', 'Admin'), userController.getUserById);
router.put('/:id', authenticate, authorizeRoles('Super Admin', 'Admin'), userController.updateUser);
router.delete('/:id', authenticate, authorizeRoles('Super Admin', 'Admin'), userController.deleteUser);
router.put('/:id/role', authenticate, authorizeRoles('Super Admin', 'Admin'), userController.updateUserRole);
router.put('/:id/status', authenticate, authorizeRoles('Super Admin', 'Admin'), userController.updateUserStatus);

module.exports = router;
