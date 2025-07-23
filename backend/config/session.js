import session from 'express-session';

const SESSION_SECRET = process.env.SESSION_SECRET;
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL;

export default session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: 'None',
    domain: FRONTEND_BASE_URL,
  }
});
