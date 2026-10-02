const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const userController = require('../controllers/user.controller');
const {
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateResendVerification,
  validateForgotPassword,
  validateResetPassword
} = require('../validators/auth.validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.post('/register', validateRegister, validate, authController.register);
router.post('/login', validateLogin, validate, authController.login);
router.post('/logout', authController.logout);
router.post('/verify-email', validateVerifyEmail, validate, authController.verifyEmail);
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', validateResendVerification, validate, authController.resendVerification);
router.post('/forgot-password', validateForgotPassword, validate, authController.forgotPassword);
router.post('/reset-password', validateResetPassword, validate, authController.resetPassword);
router.post('/google', authController.googleLogin);

// Profile is protected by JWT verification
router.get('/profile', authenticate, userController.getProfile);

module.exports = router;
