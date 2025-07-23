import session from 'express-session';

const SESSION_SECRET = process.env.SESSION_SECRET;

export default session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production', // Must be true for HTTPS (Render)
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
});
