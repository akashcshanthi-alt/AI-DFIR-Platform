const { body, query } = require('express-validator');

/**
 * Validation rules for registration.
 */
const validateRegister = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please enter a valid operator email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Clearance key (password) must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required'),
  body('role')
    .optional()
    .isIn(['Super Admin', 'Admin', 'Analyst', 'Investigator']).withMessage('Role must be one of: Super Admin, Admin, Analyst, Investigator'),
  body('department')
    .optional()
    .trim(),
  body('phone')
    .optional()
    .trim()
];

/**
 * Validation rules for login.
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please enter a valid operator email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

/**
 * Validation rules for email verification.
 */
const validateVerifyEmail = [
  body('token')
    .optional()
    .isString(),
  query('token')
    .optional()
    .isString()
];

/**
 * Validation rules for resending verification email.
 */
const validateResendVerification = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please enter a valid operator email address')
    .normalizeEmail()
];

/**
 * Validation rules for forgot password.
 */
const validateForgotPassword = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please enter a valid operator email address')
    .normalizeEmail()
];

/**
 * Validation rules for reset password.
 */
const validateResetPassword = [
  body('token')
    .trim()
    .notEmpty().withMessage('Reset token is required'),
  body('password')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateResendVerification,
  validateForgotPassword,
  validateResetPassword
};
