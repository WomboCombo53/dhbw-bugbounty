import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import session from "express-session";
import lusca from 'lusca';
import fs from "fs";
import https from "https";
import connectDB from './config/db.js';
import bugRoutes from './routes/bugs.js';
import authRoutes from './routes/auth.js';
import teamRoutes from './routes/teams.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, //process.env.NODE_ENV === "production", // Only send cookie over HTTPS in production
      sameSite: "lax",
    },
  })
);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:8080",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
  credentials: true,
};
app.use(cors(corsOptions));

// CSRF protection
// skip CSRF for /api/auth/google because google uses its own token
app.use((req, res, next) => {
  if (req.path === '/api/auth/google') return next();
  lusca.csrf()(req, res, next);
});

// fetch CSRF token
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Bug Bounty API is running',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limit for POST requests
const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 POST requests per windowMs
  message: 'Too many bug submissions, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/bugs', postLimiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/teams', teamRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
if (process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH) {
  const httpsOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
  };

  https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} (HTTPS)`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🌐 CORS origin: ${corsOptions.origin}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} (HTTP)`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🌐 CORS origin: ${corsOptions.origin}`);
  });
}

export default app;
