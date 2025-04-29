// Test script for Fyers Integration
const axios = require('axios');
const fyersClient = require('./fyers_api_client');

// Configuration
const config = {
  clientId: process.env.FYERS_CLIENT_ID || '',
  secretKey: process.env.FYERS_SECRET_KEY || '',
  redirectUri: process.env.FYERS_REDIRECT_URI || 'https://www.algoz.tech/api/brokers/fyers/callback',
  appType: process.env.FYERS_APP_TYPE || '100'
};

// Check if required config is set
if (!config.clientId || !config.secretKey) {
  console.error('ERROR: Please set FYERS_CLIENT_ID and FYERS_SECRET_KEY environment variables');
  process.exit(1);
}

// Function to test the generate auth URL
async function testGenerateAuthURL() {
  console.log('\n=== Testing Auth URL Generation ===');
  try {
    const authUrl = fyersClient.generateAuthCodeURL(config.clientId, config.appType, config.redirectUri);
    console.log('Generated Auth URL:', authUrl);
    
    // Parse the URL to check parameters
    const url = new URL(authUrl);
    const params = url.searchParams;
    
    console.log('\nURL Parameters:');
    console.log('- client_id:', params.get('client_id'));
    console.log('- redirect_uri:', params.get('redirect_uri'));
    console.log('- response_type:', params.get('response_type'));
    console.log('- state:', params.get('state'));
    console.log('- app_id:', params.get('app_id'));
    
    // Verify all required parameters are present
    const missingParams = [];
    ['client_id', 'redirect_uri', 'response_type', 'state'].forEach(param => {
      if (!params.get(param)) missingParams.push(param);
    });
    
    if (missingParams.length > 0) {
      console.error('ERROR: Missing required parameters:', missingParams.join(', '));
    } else {
      console.log('\n✅ All required parameters present in the URL');
    }
    
    return {
      success: true,
      url: authUrl
    };
  } catch (error) {
    console.error('ERROR generating auth URL:', error);
    return {
      success: false,
      error
    };
  }
}

// Main test function
async function runTests() {
  console.log('=== Fyers Integration Testing ===');
  console.log('Configuration:');
  console.log('- Client ID:', config.clientId?.substring(0, 5) + '...');
  console.log('- Secret Key:', '*****');
  console.log('- Redirect URI:', config.redirectUri);
  console.log('- App Type:', config.appType);
  
  // Test 1: Generate Auth URL
  const authUrlTest = await testGenerateAuthURL();
  
  if (!authUrlTest.success) {
    console.error('\n❌ Auth URL Generation test failed');
    process.exit(1);
  }
  
  console.log('\n=== Next Steps ===');
  console.log('1. Open this URL in your browser:');
  console.log(authUrlTest.url);
  console.log('\n2. Complete authentication on the Fyers website');
  console.log('\n3. You will be redirected to your callback URL with a code parameter');
  console.log('\n4. Use that code to generate an access token');
}

// Run the tests
runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
}); 