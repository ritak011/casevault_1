require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const slideRoutes = require('./routes/slideRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
app.use(express.json()); // parse JSON request bodies

// --- Core middleware ---
// REPLACE your current app.use(cors(...)) with this:
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  'https://casevault-2.vercel.app' // Hardcode your frontend URL directly as a backup safety net
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight OPTIONS requests explicitly so they don't block uploads
app.options('*', cors());




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
