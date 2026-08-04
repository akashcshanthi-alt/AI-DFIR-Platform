const jwt = require('jsonwebtoken');

/**
 * JWT Authentication middleware.
 * Verifies Authorization Bearer Token.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Access denied. Bearer token is missing or invalid.',
        status: 401
      }
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret-key-12345';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    const isExpired = error.name === 'TokenExpiredError';
    return res.status(401).json({
      success: false,
      error: {
        message: isExpired ? 'Clearance token has expired.' : 'Clearance token verification failed.',
        status: 401
      }
    });
  }
};

/**
 * Role-based authorization middleware (RBAC).
 * Returns 403 if the user does not possess one of the approved roles.
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. Insufficient role clearance.',
          status: 403
        }
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorizeRoles
};
