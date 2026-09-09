import axios from 'axios';

async function testGoogleAuth() {
  console.log('\n🧪 Testing Google Auth Endpoint...\n');

  try {
    // Test 1: Check if endpoint is reachable
    console.log('Test 1: Checking endpoint connectivity...');
    const healthCheck = await axios.get('http://localhost:3001/api/health');
    console.log('✅ Server is running:', healthCheck.data);

    // Test 2: Send a test credential (will fail but shows if endpoint works)
    console.log('\nTest 2: Testing /google-auth/verify endpoint with invalid token...');
    try {
      const response = await axios.post('http://localhost:3001/api/google-auth/verify', {
        credential: 'test_invalid_token_12345'
      });
      console.log('Response:', response.data);
    } catch (error) {
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Error Response:', error.response.data);
      } else {
        console.log('Error:', error.message);
      }
    }

    // Test 3: Check if we can reach the endpoint at all
    console.log('\nTest 3: Testing CORS headers...');
    const corsTest = await axios.options('http://localhost:3001/api/google-auth/verify', {
      headers: {
        'Origin': 'http://localhost:5173'
      }
    }).catch(e => {
      if (e.response) {
        return e.response;
      }
      throw e;
    });
    console.log('CORS Test Status:', corsTest.status);
    console.log('CORS Headers:', {
      'Access-Control-Allow-Origin': corsTest.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': corsTest.headers['access-control-allow-methods'],
    });

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testGoogleAuth();
