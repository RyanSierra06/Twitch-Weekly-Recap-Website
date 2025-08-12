import session from 'express-session';
import MongoStore from 'connect-mongo';

const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 24 * 60 * 60, // 24 hours
    touchAfter: 24 * 3600
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    // Try setting domain explicitly for cross-site cookies
    domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : undefined
  }
};

console.log('Session config:', {
  NODE_ENV: process.env.NODE_ENV,
  SameSite: sessionConfig.cookie.sameSite,
  Secure: sessionConfig.cookie.secure,
  Domain: sessionConfig.cookie.domain
});

export default sessionConfig;

