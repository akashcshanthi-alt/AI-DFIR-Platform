/**
 * Global Centralized Error Handler Middleware.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.stack || err.message}`);
  
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: {
      message: err.message || 'An unexpected server error occurred',
      status
    }
  });
};

module.exports = errorHandler;
