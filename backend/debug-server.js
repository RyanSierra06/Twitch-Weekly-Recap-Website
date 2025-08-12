import 'dotenv/config';
import express from 'express';

console.log('🔍 Starting debug server...');

const app = express();
const PORT = process.env.PORT || 4000;

console.log('✅ Express app created');

// Test 1: Basic route
console.log('🔍 Testing basic route...');
app.get('/test', (req, res) => {
  res.json({ message: 'Basic route working' });
});

console.log('✅ Basic route added');

// Test 2: Environment variables
console.log('🔍 Testing environment variables...');
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL;
console.log('FRONTEND_BASE_URL:', FRONTEND_BASE_URL);

if (!FRONTEND_BASE_URL) {
  console.error('❌ FRONTEND_BASE_URL not set');
  process.exit(1);
}

console.log('✅ Environment variables OK');

// Test 3: Redirect route
console.log('🔍 Testing redirect route...');
app.get('/', (req, res) => {
  const redirectUrl = `${FRONTEND_BASE_URL}/dashboard`;
  console.log('Redirecting to:', redirectUrl);
  res.redirect(redirectUrl);
});

console.log('✅ Redirect route added');

// Test 4: CORS
console.log('🔍 Testing CORS...');
import cors from 'cors';

app.use(cors({
  origin: function(origin, callback) {
    console.log('CORS origin check:', origin);
    callback(null, true);
  },
  credentials: true
}));

console.log('✅ CORS added');

// Test 5: Session (without MongoDB for now)
console.log('🔍 Testing session...');
import session from 'express-session';

app.use(session({
  secret: process.env.SESSION_SECRET || 'test-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

console.log('✅ Session added');

// Test 6: Passport
console.log('🔍 Testing passport...');
import passport from 'passport';

app.use(passport.initialize());
app.use(passport.session());

console.log('✅ Passport added');

// Test 7: Routes
console.log('🔍 Testing routes...');
try {
  const authRoutes = await import('./routes/auth.js');
  app.use('/auth', authRoutes.default);
  console.log('✅ Auth routes added');
} catch (error) {
  console.error('❌ Error adding auth routes:', error.message);
}

try {
  const userRoutes = await import('./routes/user.js');
  app.use('/api', userRoutes.default);
  console.log('✅ User routes added');
} catch (error) {
  console.error('❌ Error adding user routes:', error.message);
}

try {
  const twitchRoutes = await import('./routes/twitch.js');
  app.use('/api', twitchRoutes.default);
  console.log('✅ Twitch routes added');
} catch (error) {
  console.error('❌ Error adding twitch routes:', error.message);
}

try {
  const subscriptionRoutes = await import('./routes/subscription.js');
  app.use('/api', subscriptionRoutes.default);
  console.log('✅ Subscription routes added');
} catch (error) {
  console.error('❌ Error adding subscription routes:', error.message);
}

console.log('✅ All routes added');

// Start server
const server = app.listen(PORT, () => {
  console.log(`✅ Debug server running on port ${PORT}`);
  console.log('✅ Try accessing: http://localhost:4000/test');
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down debug server...');
  server.close(() => {
    console.log('✅ Debug server closed');
    process.exit(0);
  });
});
