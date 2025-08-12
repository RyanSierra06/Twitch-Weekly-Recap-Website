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

console.log('Session configuration:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SameSite:', process.env.NODE_ENV === 'production' ? 'none' : 'lax');
console.log('Secure:', process.env.NODE_ENV === 'production');

export default session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGO_URI,
    ttl: 7 * 24 * 60 * 60, // 7 days in seconds
    autoRemove: 'native', // Enable automatic removal of expired sessions
    touchAfter: 24 * 3600, // Only update session once per day
  }),
  cookie: {
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    httpOnly: true,
    path: '/',
    // Remove domain setting to let browser handle it automatically
  },
  name: 'connect.sid'
});

