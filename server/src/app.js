const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// Load environment variables (supports running from root or server directory)
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Middlewares
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const casesRoutes = require('./routes/cases.routes');
const reportsRoutes = require('./routes/reports.routes');
const auditRoutes = require('./routes/audit.routes');
const notificationRoutes = require('./routes/notification.routes');
const settingsRoutes = require('./routes/settings.routes');
const evidenceRoutes = require('./routes/evidence.routes');
const aiRoutes = require('./routes/ai.routes');
const iocRoutes = require('./routes/ioc.routes');
const timelineRoutes = require('./routes/timeline.routes');
const mitreRoutes = require('./routes/mitre.routes');

const app = express();

// Security rate limiter configs
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 2000 : 100, // Allow higher limit in development/testing
  message: {
    success: false,
    error: {
      message: 'Too many requests from this client. Please retry later.',
      status: 429
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 20, // Allow higher limit in development/testing
  message: {
    success: false,
    error: {
      message: 'Too many clearance verification attempts. Please retry in 15 minutes.',
      status: 429
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply security and utility middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limits
app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);

// Custom logging
app.use(morgan('dev'));
app.use(logger);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  const dbState = mongoose.connection.readyState;
  res.status(200).json({
    success: true,
    status: 'UP',
    database: {
      status: dbStateMap[dbState] || 'unknown',
      name: mongoose.connection.name || null,
      host: mongoose.connection.host || null,
      port: mongoose.connection.port || null
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Route registration mappings
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ioc', iocRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/mitre', mitreRoutes);

// Catch 404
app.use((req, res, next) => {
  const error = new Error(`Resource Not Found: [${req.originalUrl}]`);
  error.statusCode = 404;
  next(error);
});

// Centralized error coordinator
app.use(errorHandler);

module.exports = app;
