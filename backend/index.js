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

console.log('Environment variables:');
console.log('FRONTEND_BASE_URL:', FRONTEND_BASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);

// Validate environment variables
if (!FRONTEND_BASE_URL) {
  console.error('❌ FRONTEND_BASE_URL environment variable is not set');
  process.exit(1);
}

if (!process.env.SESSION_SECRET) {
  console.error('❌ SESSION_SECRET environment variable is not set');
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI environment variable is not set');
  process.exit(1);
}

if (!process.env.TWITCH_CLIENT_ID) {
  console.error('❌ TWITCH_CLIENT_ID environment variable is not set');
  process.exit(1);
}

if (!process.env.TWITCH_SECRET) {
  console.error('❌ TWITCH_SECRET environment variable is not set');
  process.exit(1);
}

if (!process.env.TWITCH_CALLBACK_URL) {
  console.error('❌ TWITCH_CALLBACK_URL environment variable is not set');
  process.exit(1);
}

console.log('✅ All required environment variables are set');

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

// More permissive CORS for debugging
app.use(cors({
    origin: function(origin, callback) {
        console.log('CORS origin check:', origin);
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            console.log('Allowing request with no origin');
            return callback(null, true);
        }
        
        // Allow the frontend URL
        if (origin === FRONTEND_BASE_URL) {
            console.log('Allowing frontend origin:', origin);
            return callback(null, true);
        }
        
        // Allow localhost for development
        if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost')) {
            console.log('Allowing localhost origin:', origin);
            return callback(null, true);
        }
        
        // For production, be more permissive during debugging
        if (process.env.NODE_ENV === 'production') {
            console.log('Allowing production origin:', origin);
            return callback(null, true);
        }
        
        console.log('Rejecting origin:', origin);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'Cookie', 
        'X-Requested-With',
        'Cache-Control',
        'Pragma',
        'Accept',
        'Origin',
        'Referer'
    ],
    exposedHeaders: ['Set-Cookie']
}));

// Debug middleware for session tracking
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Request Origin:', req.headers.origin);
  console.log('Request Referer:', req.headers.referer);
  console.log('Request Headers:', req.headers);
  console.log('Cookies:', req.headers.cookie);
  console.log('Session ID:', req.sessionID);
  console.log('Session exists:', !!req.session);
  console.log('Session passport exists:', !!(req.session && req.session.passport));
  console.log('Session passport user exists:', !!(req.session && req.session.passport && req.session.passport.user));
  console.log('Session data:', req.session);
  console.log('Passport user:', req.user);
  
  // Ensure session is saved after each request
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    if (req.session && req.session.save) {
      req.session.save((err) => {
        if (err) {
          console.error('Session save error in middleware:', err);
        } else {
          console.log('Session saved successfully');
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

console.log('✅ Routes mounted successfully');

app.set('trust proxy', 1);

app.get('/', function (req, res) {
    console.log('Root endpoint called');
    console.log('FRONTEND_BASE_URL:', FRONTEND_BASE_URL);
    console.log('Session user:', req.session?.passport?.user);
    
    if (req.session?.passport?.user || req.user) {
        const redirectUrl = `${FRONTEND_BASE_URL}/dashboard`;
        console.log('Redirecting to:', redirectUrl);
        res.redirect(redirectUrl);
    } else {
        console.log('Redirecting to frontend base URL:', FRONTEND_BASE_URL);
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

// Test session endpoint
app.get('/test-session', (req, res) => {
  console.log('=== TEST SESSION ENDPOINT CALLED ===');
  console.log('Request headers:', req.headers);
  console.log('Session ID:', req.sessionID);
  console.log('Session exists:', !!req.session);
  console.log('Session passport exists:', !!(req.session && req.session.passport));
  console.log('Session passport user exists:', !!(req.session && req.session.passport && req.session.passport.user));
  
  res.json({
    sessionExists: !!req.session,
    sessionId: req.sessionID,
    passportExists: !!(req.session && req.session.passport),
    userExists: !!(req.session && req.session.passport && req.session.passport.user),
    sessionData: req.session,
    headers: {
      origin: req.headers.origin,
      referer: req.headers.referer,
      cookie: req.headers.cookie
    }
  });
});

// Test CORS endpoint
app.get('/test-cors', (req, res) => {
  console.log('=== CORS TEST ENDPOINT CALLED ===');
  console.log('Request headers:', req.headers);
  res.json({ 
    message: 'CORS test successful',
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// Test authentication endpoint
app.get('/test-auth', (req, res) => {
  console.log('=== TEST AUTH ENDPOINT CALLED ===');
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', JSON.stringify(req.session, null, 2));
  console.log('Passport user:', req.user);
  
  res.json({
    authenticated: !!(req.session && req.session.passport && req.session.passport.user),
    user: req.session?.passport?.user || null,
    sessionId: req.sessionID,
    sessionExists: !!req.session,
    passportExists: !!(req.session && req.session.passport)
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
