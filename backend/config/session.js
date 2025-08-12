import session from 'express-session';
import MongoStore from 'connect-mongo';

const SESSION_SECRET = process.env.SESSION_SECRET;
const MONGO_URI = process.env.MONGO_URI;

if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is not defined');
}

if (!MONGO_URI) {
  throw new Error('MONGO_URI environment variable is not defined');
}

// Enhanced session configuration for maximum compatibility
export default session({
  secret: SESSION_SECRET,
  resave: true, // Changed back to true for better reliability
  saveUninitialized: true, // Allow uninitialized sessions
  store: MongoStore.create({
    mongoUrl: MONGO_URI,
    ttl: 7 * 24 * 60 * 60, // 7 days in seconds
    autoRemove: 'native',
    touchAfter: 24 * 3600,
    crypto: {
      secret: SESSION_SECRET
    },
    // Enhanced MongoDB store options
    collectionName: 'sessions',
    stringify: false,
    mongoOptions: {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1
    }
  }),
  cookie: {
    // Maximum compatibility settings
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    path: '/',
    domain: undefined, // Let browser handle domain
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  name: 'connect.sid',
  rolling: true,
  unset: 'destroy',
  // Additional reliability options
  proxy: true
});

