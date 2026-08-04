const { body } = require('express-validator');

/**
 * Validation rules for registration.
 */
const validateRegister = [
  body('email')
    .isEmail().withMessage('Please enter a valid operator email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Clearance key (password) must be at least 6 characters long'),
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required'),
  body('role')
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
    .isEmail().withMessage('Please enter a valid operator email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

module.exports = {
  validateRegister,
  validateLogin
};
