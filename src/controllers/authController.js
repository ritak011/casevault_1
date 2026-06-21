const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route   POST /api/auth/register
 * @access  Public
 * Registers a new user, hashes the password (handled by the User model's
 * pre-save hook), and returns a JWT so the user is logged in immediately.
 */
const register = asyncHandler(async (req, res) => {
  console.log("RECEIVED BODY:", req.body);
  const { name, email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error('A user with that email already exists');
  }

  const user = await User.create({ name, email, password });

  res.status(201).json({
    success: true,
    data: {
      user: { id: user._id, name: user.name, email: user.email },
      token: generateToken(user._id),
    },
  });
});

/**
 * @route   POST /api/auth/login
 * @access  Public
 * Authenticates credentials and returns a JWT on success.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  // .select('+password') because the schema excludes password by default
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({
    success: true,
    data: {
      user: { id: user._id, name: user.name, email: user.email },
      token: generateToken(user._id),
    },
  });
});

module.exports = { register, login };
