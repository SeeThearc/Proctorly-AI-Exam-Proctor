const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route.  Please login.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process. env.JWT_SECRET);

      // Get user from token (including password for potential re-verification)
      req.user = await User.findById(decoded.id).select('+password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found.  Token invalid.'
        });
      }

      // Check if user is active
      if (!req.user.isActive) {
        return res. status(401).json({
          success: false,
          message:  'Your account has been deactivated.  Please contact admin.'
        });
      }

      // Remove password from user object before proceeding
      req.user.password = undefined;

      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please login again.'
        });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please login again.'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Not authorized to access this route'
        });
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    next(error);
  }
};
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};
