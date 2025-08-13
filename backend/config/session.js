import session from 'express-session';
import MongoStore from 'connect-mongo';

const SESSION_SECRET = process.env.SESSION_SECRET;
const MONGO_URI = process.env.MONGO_URI;

if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is not defined');
}

// Create session store with fallback
let sessionStore;

try {
  if (MONGO_URI) {
    console.log('Creating MongoDB session store...');
    sessionStore = MongoStore.create({
      mongoUrl: MONGO_URI,
      ttl: 7 * 24 * 60 * 60, // 7 days in seconds
      autoRemove: 'native',
      touchAfter: 24 * 3600,
      crypto: {
        secret: SESSION_SECRET
      },
      // Only use supported connect-mongo options
      collectionName: 'sessions'
    });
    console.log('MongoDB session store created successfully');
  } else {
    throw new Error('MONGO_URI not provided');
  }
} catch (error) {
  console.warn('Failed to create MongoDB session store:', error.message);
  console.log('Falling back to memory-based sessions');
  sessionStore = undefined; // Will use memory store
}

// Enhanced session configuration for maximum compatibility
export default session({
  secret: SESSION_SECRET,
  resave: true, // Changed back to true for better reliability
  saveUninitialized: true, // Allow uninitialized sessions
  store: sessionStore, // Will be undefined if MongoDB fails, using memory store
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

