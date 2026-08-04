/**
 * Custom logging middleware to trace request timing and routing.
 */
const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[TRACE AI Request] ${timestamp} - ${req.method} ${req.originalUrl}`);
  next();
};

module.exports = logger;
