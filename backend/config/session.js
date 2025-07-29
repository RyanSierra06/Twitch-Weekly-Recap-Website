import session from 'express-session';
import MongoStore from 'connect-mongo';

const SESSION_SECRET = process.env.SESSION_SECRET;
const MONGO_URI = process.env.MONGO_URI;

export default session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGO_URI,
    ttl: 24 * 60 * 60,
  }),
  cookie: {
    sameSite: process.env.NODE_ENV ? 'none' : 'lax',
    secure: process.env.NODE_ENV,
    maxAge: 24 * 60 * 60 * 1000,
  }
});

