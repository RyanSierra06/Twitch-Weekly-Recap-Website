import 'dotenv/config';
import fetch from 'node-fetch';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const FRONTEND_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow');
  console.log('Backend URL:', BACKEND_URL);
  console.log('Frontend URL:', FRONTEND_URL);
  console.log('');

  try {
    // Test 1: Check if backend is running
    console.log('1️⃣ Testing backend connectivity...');
    const healthCheck = await fetch(`${BACKEND_URL}/api/auth-status`);
    console.log('   Backend status:', healthCheck.status);
    
    if (healthCheck.ok) {
      const healthData = await healthCheck.json();
      console.log('   Backend response:', healthData);
    }
    console.log('');

    // Test 2: Check session endpoint
    console.log('2️⃣ Testing session endpoint...');
    const sessionTest = await fetch(`${BACKEND_URL}/auth/test-session`);
    console.log('   Session test status:', sessionTest.status);
    
    if (sessionTest.ok) {
      const sessionData = await sessionTest.json();
      console.log('   Session data:', JSON.stringify(sessionData, null, 2));
    }
    console.log('');

    // Test 3: Check OAuth initiation
    console.log('3️⃣ Testing OAuth initiation...');
    const oauthTest = await fetch(`${BACKEND_URL}/auth/twitch`);
    console.log('   OAuth redirect status:', oauthTest.status);
    console.log('   OAuth redirect URL:', oauthTest.url);
    console.log('');

    // Test 4: Check CORS headers
    console.log('4️⃣ Testing CORS configuration...');
    const corsTest = await fetch(`${BACKEND_URL}/api/auth-status`, {
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    console.log('   CORS preflight status:', corsTest.status);
    console.log('   CORS headers:', {
      'Access-Control-Allow-Origin': corsTest.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Credentials': corsTest.headers.get('Access-Control-Allow-Credentials'),
      'Access-Control-Allow-Methods': corsTest.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': corsTest.headers.get('Access-Control-Allow-Headers')
    });
    console.log('');

    console.log('✅ Authentication flow test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAuthFlow();
