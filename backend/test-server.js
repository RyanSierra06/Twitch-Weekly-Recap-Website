import 'dotenv/config';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 4000;

console.log('🧪 Testing minimal server...');
console.log('Environment variables:');
console.log('FRONTEND_BASE_URL:', process.env.FRONTEND_BASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);

// Test basic route
app.get('/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

// Test root route
app.get('/', (req, res) => {
  res.json({ message: 'Root route working' });
});

// Test with redirect
app.get('/redirect', (req, res) => {
  const frontendUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}/test`);
});

const server = app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log('✅ Try accessing: http://localhost:4000/test');
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test server...');
  server.close(() => {
    console.log('✅ Test server closed');
    process.exit(0);
  });
});
