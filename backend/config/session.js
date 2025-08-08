import session from 'express-session';
import MongoStore from 'connect-mongo';

const SESSION_SECRET = process.env.SESSION_SECRET;
const MONGO_URI = process.env.MONGO_URI;

const mongoStore = MongoStore.create({
  mongoUrl: MONGO_URI,
  ttl: 24 * 60 * 60,
});

// Add MongoDB connection debugging
mongoStore.on('connected', () => {
  console.log('MongoDB session store connected');
});

mongoStore.on('error', (error) => {
  console.error('MongoDB session store error:', error);
});

export default session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: mongoStore,
  cookie: {
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
  }
});



