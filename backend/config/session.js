import session from 'express-session';
import MongoStore from 'connect-mongo';

const SESSION_SECRET = process.env.SESSION_SECRET;
const MONGO_URI = process.env.MONGO_URI;
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is not defined');
}

if (!MONGO_URI) {
  throw new Error('MONGO_URI environment variable is not defined');
}

// Create MongoDB store
const mongoStore = MongoStore.create({
  mongoUrl: MONGO_URI,
  ttl: 7 * 24 * 60 * 60, // 7 days in seconds
  autoRemove: 'native',
  touchAfter: 24 * 3600, // Only update session once per day
  crypto: {
    secret: SESSION_SECRET
  }
});

// Session configuration
const sessionConfig = {
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: mongoStore,
  name: 'connect.sid',
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    httpOnly: true,
    path: '/',
    secure: NODE_ENV === 'production',
    sameSite: NODE_ENV === 'production' ? 'none' : 'lax'
  }
};

// Add rolling sessions for production
if (NODE_ENV === 'production') {
  sessionConfig.rolling = true;
  sessionConfig.cookie.secure = true;
  sessionConfig.cookie.sameSite = 'none';
}

export default session(sessionConfig);

