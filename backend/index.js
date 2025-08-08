import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from './config/session.js';
import passport from './config/passport.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import twitchRoutes from './routes/twitch.js';
import subscriptionRoutes from './routes/subscription.js';

const app = express();
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL;

// Configure CORS FIRST (before session middleware)
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      FRONTEND_BASE_URL,
      process.env.FRONTEND_BASE_URL,
      // Add any additional allowed origins for production
      ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));

// Trust proxy for session cookies
app.set('trust proxy', 1);

// Session middleware AFTER CORS
app.use(session);
app.use(express.static('public'));
app.use(passport.initialize());
app.use(passport.session());

// Add session debugging middleware
app.use((req, res, next) => {
    console.log('=== Session Debug ===');
    console.log('Session ID:', req.sessionID);
    console.log('Session exists:', !!req.session);
    console.log('Session passport exists:', !!req.session?.passport);
    console.log('Session passport user exists:', !!req.session?.passport?.user);
    console.log('User object exists:', !!req.user);
    console.log('Request cookies:', req.headers.cookie);
    next();
});

app.use('/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api', twitchRoutes);
app.use('/api', subscriptionRoutes);

app.set('trust proxy', 1);

// Health check endpoint
app.get('/health', function (req, res) {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        frontendUrl: FRONTEND_BASE_URL
    });
});

// Session test endpoint
app.get('/test-session', function (req, res) {
    res.json({
        sessionID: req.sessionID,
        hasSession: !!req.session,
        hasPassport: !!req.session?.passport,
        hasUser: !!req.session?.passport?.user,
        userData: req.session?.passport?.user || null
    });
});

app.get('/', function (req, res) {
    console.log('=== Root Route Debug ===');
    console.log('Session exists:', !!req.session);
    console.log('Passport user exists:', !!req.session?.passport?.user);
    
    if (req.session?.passport?.user) {
        console.log('User authenticated, redirecting to dashboard');
        res.redirect(`${FRONTEND_BASE_URL}/dashboard`);
    } else {
        console.log('No user, redirecting to frontend');
        res.redirect(FRONTEND_BASE_URL);
    }
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
