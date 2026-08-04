const { validationResult } = require('express-validator');

/**
 * Evaluates request fields against validation chains and intercepts errors.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        status: 400,
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      }
    });
  }
  next();
};

module.exports = validate;
