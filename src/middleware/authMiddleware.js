const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — route guard middleware.
 *
 * Expects: Authorization: Bearer <token>
 * On success: attaches the authenticated user to req.user and calls next().
 * On failure: responds 401 immediately, never calls next().
 */
async function protect(req, res, next) {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — no token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — user no longer exists',
      });
    }

    req.user = user; // available to all downstream controllers
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — invalid or expired token',
    });
  }
}

module.exports = { protect };
