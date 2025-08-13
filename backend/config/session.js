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

export default session({
  secret: SESSION_SECRET,
  resave: true, // Changed to true to ensure session is saved on every request
  saveUninitialized: true, // Changed to true to save sessions even if they're empty
  store: MongoStore.create({
    mongoUrl: MONGO_URI,
    ttl: 7 * 24 * 60 * 60, // 7 days in seconds
    autoRemove: 'native', // Enable automatic removal of expired sessions
    touchAfter: 24 * 3600, // Only update session once per day
    crypto: {
      secret: SESSION_SECRET
    }
    // Removed deprecated mongoOptions as they're no longer needed in MongoDB Driver 4.0.0+
  }),
  cookie: {
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    httpOnly: true,
    path: '/',
    // Don't set domain in production to allow cross-origin cookies
    domain: undefined
  },
  name: 'connect.sid',
  rolling: true, // Extend session on every request
  unset: 'destroy' // Destroy session when unset
});

