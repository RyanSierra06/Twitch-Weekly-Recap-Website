import fetch from 'node-fetch';

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://twitch-weekly-recap-website.onrender.com' 
  : 'http://localhost:4000';

async function testAuth() {
  console.log('=== Testing token-based authentication endpoints ===\n');
  console.log('Base URL:', BASE_URL);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  
  // Test root redirect
  try {
    console.log('\n1. Testing root redirect...');
    const rootResponse = await fetch(`${BASE_URL}/`);
    console.log('Root Redirect Status:', rootResponse.status);
    console.log('Root Redirect URL:', rootResponse.url);
  } catch (error) {
    console.error('Error testing root redirect:', error.message);
  }
  
  // Test Twitch OAuth URL
  try {
    console.log('\n2. Testing Twitch OAuth URL...');
    const oauthResponse = await fetch(`${BASE_URL}/auth/twitch`);
    console.log('OAuth Redirect Status:', oauthResponse.status);
    console.log('OAuth Redirect URL:', oauthResponse.url);
  } catch (error) {
    console.error('Error testing OAuth URL:', error.message);
  }
  
  // Test user endpoint without token
  try {
    console.log('\n3. Testing /api/user endpoint without token...');
    const userResponse = await fetch(`${BASE_URL}/api/user`);
    const userData = await userResponse.json();
    console.log('User Data Response:', userData);
    console.log('Status Code:', userResponse.status);
  } catch (error) {
    console.error('Error testing user endpoint:', error.message);
  }
  
  // Test user endpoint with invalid token
  try {
    console.log('\n4. Testing /api/user endpoint with invalid token...');
    const userResponse = await fetch(`${BASE_URL}/api/user`, {
      headers: {
        'Authorization': 'Bearer invalid_token'
      }
    });
    const userData = await userResponse.json();
    console.log('User Data Response:', userData);
    console.log('Status Code:', userResponse.status);
  } catch (error) {
    console.error('Error testing user endpoint with invalid token:', error.message);
  }
  
  // Test followed endpoint without token
  try {
    console.log('\n5. Testing /api/followed endpoint without token...');
    const followedResponse = await fetch(`${BASE_URL}/api/followed`);
    const followedData = await followedResponse.json();
    console.log('Followed Data Response:', followedData);
    console.log('Status Code:', followedResponse.status);
  } catch (error) {
    console.error('Error testing followed endpoint:', error.message);
  }
  
  // Test VODs endpoint without token
  try {
    console.log('\n6. Testing /api/vods endpoint without token...');
    const vodsResponse = await fetch(`${BASE_URL}/api/vods?user_id=test&started_at=2024-01-01T00:00:00Z&ended_at=2024-01-02T00:00:00Z`);
    const vodsData = await vodsResponse.json();
    console.log('VODs Data Response:', vodsData);
    console.log('Status Code:', vodsResponse.status);
  } catch (error) {
    console.error('Error testing VODs endpoint:', error.message);
  }
  
  console.log('\n=== Test completed ===');
  console.log('\nTo test full authentication flow:');
  console.log('1. Visit', `${BASE_URL}/auth/twitch`, 'in your browser');
  console.log('2. Complete the Twitch OAuth flow');
  console.log('3. You should be redirected to the dashboard with tokens in URL');
  console.log('\nExpected behavior:');
  console.log('- All endpoints should return 401 without valid token');
  console.log('- OAuth flow should redirect to frontend with tokens');
  console.log('- Frontend should store tokens and use them for API calls');
  console.log('- No session cookies should be used');
}

testAuth();
