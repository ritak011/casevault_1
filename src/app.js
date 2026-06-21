const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const slideRoutes = require('./routes/slideRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// --- Core middleware ---
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(',') || '*',
  })
);
app.use(express.json()); // parse JSON request bodies

// --- Health check ---
app.get('/', (req, res) => {
  res.json({ success: true, message: 'CaseVault API is running' });
});

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/slides', slideRoutes);

// --- 404 + error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
