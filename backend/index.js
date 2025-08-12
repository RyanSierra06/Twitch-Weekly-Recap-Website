import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from './config/session.js';
import passport from './config/passport.js';
import { connectDB, disconnectDB } from './config/database.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import twitchRoutes from './routes/twitch.js';
import subscriptionRoutes from './routes/subscription.js';

const app = express();
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL;
const PORT = process.env.PORT || 4000;

// Production optimizations
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(compression());

// Rate limiting - more generous for web applications
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (much more generous)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false, // Count failed requests
});
app.use(limiter);

// Connect to MongoDB
connectDB().catch(console.error);

app.use(session);
app.use(express.static('public'));
app.use(passport.initialize());
app.use(passport.session());
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow the frontend URL
        if (origin === FRONTEND_BASE_URL) {
            return callback(null, true);
        }
        
        // Allow localhost for development
        if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost')) {
            return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie']
}));

// Debug middleware for session tracking
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Cookies:', req.headers.cookie);
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', req.session);
  console.log('Passport user:', req.user);
  
  // Ensure session is saved after each request
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    if (req.session && req.session.save) {
      req.session.save((err) => {
        if (err) {
          console.error('Session save error in middleware:', err);
        }
        originalEnd.call(this, chunk, encoding);
      });
    } else {
      originalEnd.call(this, chunk, encoding);
    }
  };
  
  next();
});

app.use('/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api', twitchRoutes);
app.use('/api', subscriptionRoutes);

app.set('trust proxy', 1);

app.get('/', function (req, res) {
    if (req.session?.passport?.user || req.user) {
        res.redirect(`${FRONTEND_BASE_URL}/dashboard`);
    } else {
        res.redirect(FRONTEND_BASE_URL);
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    frontendUrl: FRONTEND_BASE_URL
  });
});

// Authentication status endpoint
app.get('/auth/status', (req, res) => {
    if (req.session?.passport?.user || req.user) {
        res.json({ 
            authenticated: true, 
            user: req.session?.passport?.user || req.user 
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Check if headers have already been sent
  if (!res.headersSent) {
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('HTTP server closed.');
    
    try {
      await disconnectDB();
      console.log('Database disconnected.');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit immediately, just log the error
});
