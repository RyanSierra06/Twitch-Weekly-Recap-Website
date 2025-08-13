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

// Trust proxy for production
app.set('trust proxy', 1);

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

// Enhanced CORS configuration for maximum compatibility
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow the frontend URL
        if (origin === FRONTEND_BASE_URL) {
            return callback(null, true);
        }
        
        // Allow localhost for development
        if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
            return callback(null, true);
        }
        
        // Allow test requests from node-fetch
        if (origin === 'http://localhost:4000' || origin === 'https://twitch-weekly-recap-website.onrender.com') {
            return callback(null, true);
        }
        
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'Cookie', 
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-CSRF-Token'
    ],
    exposedHeaders: ['Set-Cookie', 'X-Total-Count'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400 // 24 hours
}));

// Session middleware
app.use(session);

// Enhanced session validation middleware
app.use((req, res, next) => {
  if (!req.session) {
    console.error('Session middleware not working properly');
    return res.status(500).json({ error: 'Session not available' });
  }
  
  // Log session state for debugging
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Session ID:', req.sessionID);
  console.log('Session exists:', !!req.session);
  console.log('Session data:', req.session);
  console.log('Cookies:', req.headers.cookie);
  console.log('User-Agent:', req.headers['user-agent']);
  
  // Validate session store
  if (req.sessionStore) {
    console.log('Session store type:', req.sessionStore.constructor.name);
  } else {
    console.log('No session store configured (using memory store)');
  }
  
  next();
});

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Enhanced passport validation
app.use((req, res, next) => {
  if (req.user) {
    console.log('Passport user found:', req.user.id);
  } else if (req.session?.passport?.user) {
    console.log('Session passport user found:', req.session.passport.user.id);
  } else {
    console.log('No authenticated user found');
  }
  next();
});

// Static files
app.use(express.static('public'));

// Routes
app.use('/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api', twitchRoutes);
app.use('/api', subscriptionRoutes);

app.get('/', function (req, res) {
    // Check passport user first (most reliable)
    if (req.user) {
        res.redirect(`${FRONTEND_BASE_URL}/dashboard`);
    } else if (req.session?.passport?.user) {
        // Fall back to session passport user
        res.redirect(`${FRONTEND_BASE_URL}/dashboard`);
    } else {
        res.redirect(FRONTEND_BASE_URL);
    }
});

// Authentication status endpoint
app.get('/auth/status', (req, res) => {
    // Check passport user first (most reliable)
    if (req.user) {
        res.json({ 
            authenticated: true, 
            user: req.user 
        });
    } else if (req.session?.passport?.user) {
        // Fall back to session passport user
        res.json({ 
            authenticated: true, 
            user: req.session.passport.user 
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Test session endpoint
app.get('/auth/test-session', (req, res) => {
    console.log('Test session endpoint called');
    console.log('Session ID:', req.sessionID);
    console.log('Session exists:', !!req.session);
    console.log('Session data:', req.session);
    console.log('Cookies:', req.headers.cookie);
    
    // Create a test session
    req.session.test = 'session_working';
    req.session.testTime = new Date().toISOString();
    req.session.save((err) => {
        if (err) {
            console.error('Error saving test session:', err);
            return res.status(500).json({ error: 'Failed to save session' });
        }
        
        console.log('Test session saved successfully');
        res.json({ 
            message: 'Test session created',
            sessionId: req.sessionID,
            sessionData: req.session,
            cookies: req.headers.cookie
        });
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', err.stack);
  
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
    console.log(`Frontend URL: ${FRONTEND_BASE_URL}`);
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
