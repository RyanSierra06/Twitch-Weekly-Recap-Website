import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000';

async function testAuth() {
  console.log('Testing authentication endpoints...\n');
  
  // Test session creation
  try {
    console.log('1. Testing session creation...');
    const sessionResponse = await fetch(`${BASE_URL}/auth/test-session`);
    const sessionData = await sessionResponse.json();
    console.log('Session Test Response:', sessionData);
    console.log('Status Code:', sessionResponse.status);
    console.log('Set-Cookie Header:', sessionResponse.headers.get('set-cookie'));
  } catch (error) {
    console.error('Error testing session creation:', error.message);
  }
  
  // Test auth status endpoint
  try {
    console.log('\n2. Testing /auth/status endpoint...');
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
    console.log('\n3. Testing /api/user endpoint...');
    const userResponse = await fetch(`${BASE_URL}/api/user`);
    const userData = await userResponse.json();
    console.log('User Data Response:', userData);
    console.log('Status Code:', userResponse.status);
  } catch (error) {
    console.error('Error testing user endpoint:', error.message);
  }
  
  // Test Twitch OAuth URL
  try {
    console.log('\n4. Testing Twitch OAuth URL...');
    const oauthResponse = await fetch(`${BASE_URL}/auth/twitch`);
    console.log('OAuth Redirect Status:', oauthResponse.status);
    console.log('OAuth Redirect URL:', oauthResponse.url);
    console.log('OAuth Headers:', Object.fromEntries(oauthResponse.headers.entries()));
  } catch (error) {
    console.error('Error testing OAuth URL:', error.message);
  }
  
  console.log('\nTest completed. If you see "Not authenticated" responses, that\'s expected for unauthenticated requests.');
  console.log('To test full authentication flow:');
  console.log('1. Visit http://localhost:4000/auth/twitch in your browser');
  console.log('2. Complete the Twitch OAuth flow');
  console.log('3. You should be redirected to the dashboard');
  console.log('\nTo test in production:');
  console.log('1. Visit https://twitch-weekly-recap-website.onrender.com/auth/test-session');
  console.log('2. Check if cookies are being set properly');
  console.log('3. Then try the OAuth flow');
}

testAuth();
