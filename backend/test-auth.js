import fetch from 'node-fetch';

const BASE_URL = 'https://twitch-weekly-recap-website.onrender.com';

async function testAuth() {
  console.log('🧪 Testing authentication endpoints...\n');
  
  // Test CORS preflight
  try {
    console.log('🔍 Testing CORS preflight...');
    const preflightResponse = await fetch(`${BASE_URL}/api/user`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://twitch-weekly-recap.vercel.app',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'cache-control, pragma'
      }
    });
    console.log('✅ CORS Preflight Status:', preflightResponse.status);
    console.log('✅ CORS Headers:', Object.fromEntries(preflightResponse.headers.entries()));
  } catch (error) {
    console.error('❌ Error testing CORS preflight:', error.message);
  }
  
  // Test health endpoint
  try {
    console.log('\n🔍 Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData);
  } catch (error) {
    console.error('❌ Error testing health endpoint:', error.message);
  }
  
  // Test session endpoint
  try {
    console.log('\n🔍 Testing session endpoint...');
    const sessionResponse = await fetch(`${BASE_URL}/test-session`);
    const sessionData = await sessionResponse.json();
    console.log('✅ Session Test:', JSON.stringify(sessionData, null, 2));
  } catch (error) {
    console.error('❌ Error testing session endpoint:', error.message);
  }
  
  // Test auth endpoint
  try {
    console.log('\n🔍 Testing auth endpoint...');
    const authResponse = await fetch(`${BASE_URL}/test-auth`);
    const authData = await authResponse.json();
    console.log('✅ Auth Test:', JSON.stringify(authData, null, 2));
  } catch (error) {
    console.error('❌ Error testing auth endpoint:', error.message);
  }
  
  // Test auth status endpoint
  try {
    console.log('\n🔍 Testing auth status endpoint...');
    const statusResponse = await fetch(`${BASE_URL}/auth/status`);
    const statusData = await statusResponse.json();
    console.log('✅ Auth Status:', JSON.stringify(statusData, null, 2));
  } catch (error) {
    console.error('❌ Error testing auth status:', error.message);
  }
  
  // Test user endpoint
  try {
    console.log('\n🔍 Testing user endpoint...');
    const userResponse = await fetch(`${BASE_URL}/api/user`);
    console.log('📊 User endpoint status:', userResponse.status);
    const userData = await userResponse.json();
    console.log('✅ User Data:', JSON.stringify(userData, null, 2));
  } catch (error) {
    console.error('❌ Error testing user endpoint:', error.message);
  }
  
  console.log('\n🎯 Test completed. Check the logs above for authentication status.');
}

testAuth();
