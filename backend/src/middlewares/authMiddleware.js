import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect middleware to verify JWT token and attach user to request
export const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    try {
      token = authHeader.split(' ')[1];

      if (!token || token.trim() === '') {
        return res.status(401).json({
          message: 'Token extraction failed: Bearer token is missing or empty in Authorization header',
        });
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'sahay_jwt_secret_dev_key_2026'
      );

      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          message: 'Token extraction failed: User associated with token not found',
        });
      }

      // Attach hospitalId from the JWT payload (it is not stored on the User doc directly)
      req.user = user;
      req.user.hospitalId = decoded.hospitalId || user.hospitalId || null;
      next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      return res.status(401).json({
        message: `Token extraction failed: ${error.message}`,
      });
    }
  } else {
    return res.status(401).json({
      message: 'Token extraction failed: No Bearer token provided in Authorization header',
    });
  }
};

// Role-based authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Token extraction failed: User authentication required',
      });
    }

    const userRole = req.user.role ? req.user.role.toLowerCase() : '';
    const allowedRoles = roles.map((r) => r.toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: `Forbidden: role '${req.user.role}' does not have access to this resource. Allowed roles: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

