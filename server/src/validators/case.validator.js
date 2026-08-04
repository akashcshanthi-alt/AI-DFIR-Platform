const { body } = require('express-validator');

/**
 * Request validation schema filters for Incident Cases.
 */
const validateCreateCase = [
  body('title')
    .trim()
    .notEmpty().withMessage('Incident/Case title is required')
    .isLength({ max: 100 }).withMessage('Case title must not exceed 100 characters'),
  body('severity')
    .isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Severity level must be one of: Low, Medium, High, Critical'),
  body('status')
    .optional()
    .isIn(['Open', 'Investigating', 'Closed']).withMessage('Status must be one of: Open, Investigating, Closed'),
  body('assignedAnalyst')
    .optional()
    .trim(),
  body('description')
    .optional()
    .trim(),
  body('sourceIP')
    .optional()
    .trim(),
  body('destinationIP')
    .optional()
    .trim(),
  body('evidenceCount')
    .optional()
    .isInt({ min: 0 }).withMessage('Evidence count must be a non-negative integer'),
  body('targetHost')
    .optional()
    .trim()
];

const validateUpdateCase = [
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Incident/Case title cannot be empty')
    .isLength({ max: 100 }).withMessage('Case title must not exceed 100 characters'),
  body('severity')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Severity level must be one of: Low, Medium, High, Critical'),
  body('status')
    .optional()
    .isIn(['Open', 'Investigating', 'Closed']).withMessage('Status must be one of: Open, Investigating, Closed'),
  body('assignedAnalyst')
    .optional()
    .trim(),
  body('description')
    .optional()
    .trim(),
  body('sourceIP')
    .optional()
    .trim(),
  body('destinationIP')
    .optional()
    .trim(),
  body('evidenceCount')
    .optional()
    .isInt({ min: 0 }).withMessage('Evidence count must be a non-negative integer'),
  body('targetHost')
    .optional()
    .trim()
];

module.exports = {
  validateCreateCase,
  validateUpdateCase
};

