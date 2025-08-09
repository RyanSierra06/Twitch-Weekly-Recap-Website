// Render deployment entry point
// This file is used specifically for OnRender deployment
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import { OAuth2Strategy } from 'passport-oauth';
import request from 'request';
import mongoose from 'mongoose';

// Import routes
import authRoutes from './backend/routes/auth.js';
import userRoutes from './backend/routes/user.js';
import twitchRoutes from './backend/routes/twitch.js';
import subscriptionRoutes from './backend/routes/subscription.js';

const app = express();
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL;
const PORT = process.env.PORT || 10000;
const SESSION_SECRET = process.env.SESSION_SECRET;
const MONGO_URI = process.env.MONGO_URI;

// Validate environment variables
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is not defined');
}

if (!MONGO_URI) {
  throw new Error('MONGO_URI environment variable is not defined');
}

// Database connection
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority'
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Session configuration
const sessionConfig = session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGO_URI,
    ttl: 7 * 24 * 60 * 60,
    autoRemove: 'native',
  }),
  cookie: {
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  }
});

// Passport configuration
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_SECRET = process.env.TWITCH_SECRET;
const CALLBACK_URL = process.env.TWITCH_CALLBACK_URL;

OAuth2Strategy.prototype.userProfile = function(accessToken, done) {
  const options = {
    url: 'https://api.twitch.tv/helix/users',
    method: 'GET',
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      'Accept': 'application/vnd.twitchtv.v5+json',
      'Authorization': 'Bearer ' + accessToken
    }
  };
  request(options, function (error, response, body) {
    if (response && response.statusCode === 200) {
      done(null, JSON.parse(body));
    } else {
      done(JSON.parse(body));
    }
  });
};

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use('twitch', new OAuth2Strategy({
  authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
  tokenURL: 'https://id.twitch.tv/oauth2/token',
  clientID: TWITCH_CLIENT_ID,
  clientSecret: TWITCH_SECRET,
  callbackURL: CALLBACK_URL,
  state: true
}, function(accessToken, refreshToken, profile, done) {
  profile.accessToken = accessToken;
  profile.refreshToken = refreshToken;
  done(null, profile);
}));

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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Connect to MongoDB
connectDB().catch(console.error);

// Middleware
app.use(sessionConfig);
app.use(express.static('public'));
app.use(passport.initialize());
app.use(passport.session());
app.use(cors({
  origin: FRONTEND_BASE_URL,
  credentials: true
}));

// Routes
app.use('/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api', twitchRoutes);
app.use('/api', subscriptionRoutes);

app.set('trust proxy', 1);

app.get('/', function (req, res) {
  if (req.session?.passport?.user) {
    res.redirect(`${FRONTEND_BASE_URL}/dashboard`);
  } else {
    res.redirect(FRONTEND_BASE_URL);
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('HTTP server closed.');
    
    try {
      await mongoose.disconnect();
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

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
