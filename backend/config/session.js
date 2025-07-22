import session from 'express-session';

const SESSION_SECRET = process.env.SESSION_SECRET;

export default session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false
});
