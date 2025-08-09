import session from 'express-session';
import MongoStore from 'connect-mongo';

const SESSION_SECRET = process.env.SESSION_SECRET;
const MONGO_URI = process.env.MONGO_URI;
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL;

if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is not defined');
}

if (!MONGO_URI) {
  throw new Error('MONGO_URI environment variable is not defined');
}

export default session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGO_URI,
    ttl: 7 * 24 * 60 * 60, // 7 days in seconds
    autoRemove: 'native', // Enable automatic removal of expired sessions
  }),
  cookie: {
    sameSite: 'none', // Required for cross-domain cookies
    secure: true, // Required when sameSite is 'none'
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    httpOnly: false, // Allow JavaScript access for debugging
    path: '/',
  },
  name: 'connect.sid' // Ensure consistent cookie name
});

