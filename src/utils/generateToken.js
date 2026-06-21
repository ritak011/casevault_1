const jwt = require('jsonwebtoken');

/**
 * Signs a JWT containing the user's id.
 * Expiry is configurable via JWT_EXPIRES_IN (defaults to 7 days).
 */
function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

module.exports = { generateToken };
