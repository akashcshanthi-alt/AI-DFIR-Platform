const { body } = require('express-validator');

/**
 * Request validation schema rules for Audit Logs.
 */
const validateExportAuditLogs = [
  body('format')
    .trim()
    .notEmpty().withMessage('Export format is required')
    .isIn(['csv', 'pdf']).withMessage('Export format must be either csv or pdf')
];

module.exports = {
  validateExportAuditLogs
};
