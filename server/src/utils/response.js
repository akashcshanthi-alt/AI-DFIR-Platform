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

const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404);
};

const badRequest = (res, message = 'Bad request') => {
  return error(res, message, 400);
};

const unauthorized = (res, message = 'Unauthorized') => {
  return error(res, message, 401);
};

const forbidden = (res, message = 'Forbidden') => {
  return error(res, message, 403);
};

module.exports = {
  success,
  error,
  notFound,
  badRequest,
  unauthorized,
  forbidden
};

