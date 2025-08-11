import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000';

async function testAuth() {
  console.log('Testing authentication endpoints...\n');
  
  // Test auth status endpoint
  try {
    const statusResponse = await fetch(`${BASE_URL}/auth/status`);
    const statusData = await statusResponse.json();
    console.log('Auth Status:', statusData);
  } catch (error) {
    console.error('Error testing auth status:', error.message);
  }
  
  // Test user endpoint
  try {
    const userResponse = await fetch(`${BASE_URL}/api/user`);
    const userData = await userResponse.json();
    console.log('User Data:', userData);
  } catch (error) {
    console.error('Error testing user endpoint:', error.message);
  }
  
  console.log('\nTest completed. If you see "Not authenticated" responses, that\'s expected for unauthenticated requests.');
}

testAuth();
