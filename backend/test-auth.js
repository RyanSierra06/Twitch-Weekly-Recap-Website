import fetch from 'node-fetch';

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://twitch-weekly-recap-website.onrender.com' 
  : 'http://localhost:4000';

async function testAuth() {
  console.log('=== Testing authentication endpoints ===\n');
  console.log('Base URL:', BASE_URL);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  
  // Test session creation
  try {
    console.log('\n1. Testing session creation...');
    const sessionResponse = await fetch(`${BASE_URL}/auth/test-session`);
    const sessionData = await sessionResponse.json();
    console.log('Session Test Response:', sessionData);
    console.log('Status Code:', sessionResponse.status);
    console.log('Set-Cookie Header:', sessionResponse.headers.get('set-cookie'));
  } catch (error) {
    console.error('Error testing session creation:', error.message);
  }
  
  // Test session health
  try {
    console.log('\n2. Testing session health...');
    const healthResponse = await fetch(`${BASE_URL}/auth/session-health`);
    const healthData = await healthResponse.json();
    console.log('Session Health Response:', healthData);
    console.log('Status Code:', healthResponse.status);
  } catch (error) {
    console.error('Error testing session health:', error.message);
  }
  
  // Test auth status endpoint
  try {
    console.log('\n3. Testing /auth/status endpoint...');
    const statusResponse = await fetch(`${BASE_URL}/auth/status`);
    const statusData = await statusResponse.json();
    console.log('Auth Status Response:', statusData);
    console.log('Status Code:', statusResponse.status);
    console.log('Cookies:', statusResponse.headers.get('set-cookie'));
  } catch (error) {
    console.error('Error testing auth status:', error.message);
  }
  
  // Test user endpoint
  try {
    console.log('\n4. Testing /api/user endpoint...');
    const userResponse = await fetch(`${BASE_URL}/api/user`);
    const userData = await userResponse.json();
    console.log('User Data Response:', userData);
    console.log('Status Code:', userResponse.status);
  } catch (error) {
    console.error('Error testing user endpoint:', error.message);
  }
  
  // Test debug endpoint
  try {
    console.log('\n5. Testing /auth/debug endpoint...');
    const debugResponse = await fetch(`${BASE_URL}/auth/debug`);
    const debugData = await debugResponse.json();
    console.log('Debug Response:', debugData);
    console.log('Status Code:', debugResponse.status);
  } catch (error) {
    console.error('Error testing debug endpoint:', error.message);
  }
  
  // Test Twitch OAuth URL
  try {
    console.log('\n6. Testing Twitch OAuth URL...');
    const oauthResponse = await fetch(`${BASE_URL}/auth/twitch`);
    console.log('OAuth Redirect Status:', oauthResponse.status);
    console.log('OAuth Redirect URL:', oauthResponse.url);
    console.log('OAuth Headers:', Object.fromEntries(oauthResponse.headers.entries()));
  } catch (error) {
    console.error('Error testing OAuth URL:', error.message);
  }
  
  console.log('\n=== Test completed ===');
  console.log('\nTo test full authentication flow:');
  console.log('1. Visit', `${BASE_URL}/auth/twitch`, 'in your browser');
  console.log('2. Complete the Twitch OAuth flow');
  console.log('3. You should be redirected to the dashboard');
  console.log('\nTo test session recovery:');
  console.log('1. Visit', `${BASE_URL}/auth/session-health`, 'to check session status');
  console.log('2. Visit', `${BASE_URL}/auth/recover-session`, 'to attempt session recovery');
  console.log('\nExpected behavior:');
  console.log('- Session should be created and maintained across requests');
  console.log('- User should be authenticated after OAuth flow');
  console.log('- No 401 errors should occur for authenticated users');
  console.log('- Session recovery should work if session data is corrupted');
}

testAuth();
