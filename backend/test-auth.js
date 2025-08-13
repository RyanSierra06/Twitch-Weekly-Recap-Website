import fetch from 'node-fetch';

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:4000';

async function testAuth() {
  console.log('=== COMPREHENSIVE AUTHENTICATION TEST ===');
  console.log('Testing backend URL:', BASE_URL);
  console.log('Timestamp:', new Date().toISOString());
  console.log('');
  
  // Test 1: Basic connectivity
  try {
    console.log('1. Testing basic connectivity...');
    const healthResponse = await fetch(`${BASE_URL}/auth/status`);
    console.log('✓ Backend is reachable');
    console.log('  Status Code:', healthResponse.status);
    console.log('  Response Headers:', Object.fromEntries(healthResponse.headers.entries()));
  } catch (error) {
    console.error('✗ Backend connectivity failed:', error.message);
    return;
  }
  
  // Test 2: Session creation
  try {
    console.log('\n2. Testing session creation...');
    const sessionResponse = await fetch(`${BASE_URL}/auth/test-session`);
    const sessionData = await sessionResponse.json();
    console.log('✓ Session creation test completed');
    console.log('  Status Code:', sessionResponse.status);
    console.log('  Session ID:', sessionData.sessionId);
    console.log('  Set-Cookie Header:', sessionResponse.headers.get('set-cookie'));
    console.log('  Response Data:', sessionData);
  } catch (error) {
    console.error('✗ Session creation failed:', error.message);
  }
  
  // Test 3: Cookie test endpoint
  try {
    console.log('\n3. Testing cookie functionality...');
    const cookieResponse = await fetch(`${BASE_URL}/auth/test-cookie`);
    const cookieData = await cookieResponse.json();
    console.log('✓ Cookie test completed');
    console.log('  Status Code:', cookieResponse.status);
    console.log('  Set-Cookie Headers:', cookieResponse.headers.get('set-cookie'));
    console.log('  Response Data:', cookieData);
  } catch (error) {
    console.error('✗ Cookie test failed:', error.message);
  }
  
  // Test 4: Auth status endpoint
  try {
    console.log('\n4. Testing /auth/status endpoint...');
    const statusResponse = await fetch(`${BASE_URL}/auth/status`);
    const statusData = await statusResponse.json();
    console.log('✓ Auth status test completed');
    console.log('  Status Code:', statusResponse.status);
    console.log('  Authenticated:', statusData.authenticated);
    console.log('  User Data:', statusData.user || 'None');
  } catch (error) {
    console.error('✗ Auth status test failed:', error.message);
  }
  
  // Test 5: User endpoint (should fail without auth)
  try {
    console.log('\n5. Testing /api/user endpoint (unauthenticated)...');
    const userResponse = await fetch(`${BASE_URL}/api/user`);
    const userData = await userResponse.json();
    console.log('✓ User endpoint test completed (expected 401)');
    console.log('  Status Code:', userResponse.status);
    console.log('  Response:', userData);
  } catch (error) {
    console.error('✗ User endpoint test failed:', error.message);
  }
  
  // Test 6: Twitch OAuth URL
  try {
    console.log('\n6. Testing Twitch OAuth URL...');
    const oauthResponse = await fetch(`${BASE_URL}/auth/twitch`);
    console.log('✓ OAuth URL test completed');
    console.log('  Redirect Status:', oauthResponse.status);
    console.log('  Redirect URL:', oauthResponse.url);
    console.log('  Location Header:', oauthResponse.headers.get('location'));
  } catch (error) {
    console.error('✗ OAuth URL test failed:', error.message);
  }
  
  // Test 7: Debug endpoint
  try {
    console.log('\n7. Testing debug endpoint...');
    const debugResponse = await fetch(`${BASE_URL}/auth/debug`);
    const debugData = await debugResponse.json();
    console.log('✓ Debug endpoint test completed');
    console.log('  Status Code:', debugResponse.status);
    console.log('  Session ID:', debugData.sessionId);
    console.log('  Session Exists:', debugData.sessionExists);
    console.log('  Passport User:', debugData.passportUser || 'None');
    console.log('  Cookies:', debugData.cookies || 'None');
  } catch (error) {
    console.error('✗ Debug endpoint test failed:', error.message);
  }
  
  // Test 8: CORS preflight
  try {
    console.log('\n8. Testing CORS preflight...');
    const corsResponse = await fetch(`${BASE_URL}/auth/status`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://twitch-weekly-recap.vercel.app',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    console.log('✓ CORS preflight test completed');
    console.log('  Status Code:', corsResponse.status);
    console.log('  Access-Control-Allow-Origin:', corsResponse.headers.get('access-control-allow-origin'));
    console.log('  Access-Control-Allow-Credentials:', corsResponse.headers.get('access-control-allow-credentials'));
  } catch (error) {
    console.error('✗ CORS preflight test failed:', error.message);
  }
  
  console.log('\n=== TEST SUMMARY ===');
  console.log('All basic connectivity tests completed.');
  console.log('');
  console.log('🔧 DIAGNOSTIC STEPS:');
  console.log('');
  console.log('1. Test cookie functionality:');
  console.log(`   Visit: ${BASE_URL}/auth/test-cookie`);
  console.log('   Check browser dev tools → Application → Cookies');
  console.log('');
  console.log('2. Test OAuth flow:');
  console.log(`   Visit: ${BASE_URL}/auth/twitch`);
  console.log('   Complete Twitch OAuth');
  console.log('   Check if redirected to dashboard with ?auth=success');
  console.log('');
  console.log('3. Debug session state:');
  console.log(`   Visit: ${BASE_URL}/auth/debug`);
  console.log('   Check response for session information');
  console.log('');
  console.log('4. Frontend debugging:');
  console.log('   Open browser dev tools → Console');
  console.log('   Look for authentication logs');
  console.log('   Check Network tab for cookie headers');
  console.log('');
  console.log('🚨 COMMON ISSUES:');
  console.log('- Cookies not being set: Check SameSite and Secure settings');
  console.log('- CORS errors: Check origin configuration');
  console.log('- Session not persisting: Check MongoDB connection');
  console.log('- 401 errors: Check if cookies are being sent with requests');
}

// Run the test
testAuth().catch(console.error);
