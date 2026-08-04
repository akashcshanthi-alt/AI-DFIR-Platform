/**
 * Standardized API response helper functions.
 */
const success = (res, data, message = 'Success', status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data
  });
};

const error = (res, message = 'An error occurred', status = 500) => {
  return res.status(status).json({
    success: false,
    error: {
      message,
      status
    }
  });
};

module.exports = {
  success,
  error
};
