const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function testRisksEndpoint() {
  try {
    console.log('🔐 Getting authentication token...');
    
    // Login to get token
    const loginCmd = `curl -s -X POST -H "Content-Type: application/json" -d '{"email":"admin@pbms.com","password":"password"}' http://localhost:3001/auth/login`;
    const { stdout: loginResponse } = await execPromise(loginCmd);
    
    const loginData = JSON.parse(loginResponse);
    if (!loginData.token) {
      console.log('❌ Failed to get authentication token');
      console.log('Login response:', loginResponse);
      return;
    }
    
    console.log('✅ Authentication successful');
    
    // Test risks endpoint
    console.log('\n🚨 Testing Risk Alerts endpoint...');
    const risksCmd = `curl -s -H "Authorization: Bearer ${loginData.token}" http://localhost:3001/api/analytics/risks`;
    const { stdout: risksResponse } = await execPromise(risksCmd);
    
    console.log('Raw response:', risksResponse);
    
    try {
      const risksData = JSON.parse(risksResponse);
      console.log('✅ Risk alerts endpoint working!');
      console.log('Number of risks:', risksData.risks ? risksData.risks.length : 0);
      if (risksData.risks && risksData.risks.length > 0) {
        console.log('Sample risk:', risksData.risks[0]);
      }
    } catch (parseError) {
      console.log('❌ Failed to parse risks response as JSON');
      console.log('Parse error:', parseError.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing risks endpoint:', error.message);
  }
}

testRisksEndpoint();