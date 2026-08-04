const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const userController = require('../controllers/user.controller');
const { validateRegister, validateLogin } = require('../validators/auth.validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.post('/register', validateRegister, validate, authController.register);
router.post('/login', validateLogin, validate, authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/google', authController.googleLogin);

// Profile is protected by JWT verification
router.get('/profile', authenticate, userController.getProfile);

module.exports = router;
