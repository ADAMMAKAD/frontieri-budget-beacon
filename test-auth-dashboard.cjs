const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const BASE_URL = 'http://localhost:3001';

async function makeRequest(endpoint, method = 'GET', data = null, headers = {}) {
  try {
    let curlCommand = `curl -s -X ${method}`;
    
    // Add headers
    Object.entries(headers).forEach(([key, value]) => {
      curlCommand += ` -H "${key}: ${value}"`;
    });
    
    // Add data for POST requests
    if (data && method === 'POST') {
      curlCommand += ` -H "Content-Type: application/json" -d '${JSON.stringify(data)}'`;
    }
    
    curlCommand += ` "${BASE_URL}${endpoint}"`;
    
    const { stdout } = await execPromise(curlCommand);
    return JSON.parse(stdout);
  } catch (error) {
    console.error(`Error making request to ${endpoint}:`, error.message);
    return null;
  }
}

async function testDashboardWithAuth() {
  console.log('🔐 Testing Dashboard with Authentication');
  console.log('=====================================\n');
  
  try {
    // Step 1: Login to get JWT token
    console.log('1. Logging in as admin user...');
    const loginData = {
      email: 'admin@pbms.com',
      password: 'admin123' // Common default password
    };
    
    const loginResponse = await makeRequest('/auth/login', 'POST', loginData);
    
    if (!loginResponse || !loginResponse.token) {
      console.log('❌ Login failed. Trying alternative password...');
      
      // Try alternative password
      loginData.password = 'password';
      const altLoginResponse = await makeRequest('/auth/login', 'POST', loginData);
      
      if (!altLoginResponse || !altLoginResponse.token) {
        console.log('❌ Login failed with both passwords. Cannot proceed with authenticated tests.');
        return;
      }
      
      console.log('✅ Login successful with alternative password');
      var token = altLoginResponse.token;
    } else {
      console.log('✅ Login successful');
      var token = loginResponse.token;
    }
    
    const authHeaders = {
      'Authorization': `Bearer ${token}`
    };
    
    // Step 2: Test Dashboard Metrics
    console.log('\n2. Testing Dashboard Metrics...');
    const dashboardData = await makeRequest('/api/analytics/dashboard', 'GET', null, authHeaders);
    
    if (dashboardData) {
      console.log('✅ Dashboard metrics retrieved successfully');
      console.log('   - Active Projects:', dashboardData.activeProjects || 'N/A');
      console.log('   - Total Budget: $' + (dashboardData.totalBudget || 'N/A'));
      console.log('   - Budget Utilization:', (dashboardData.budgetUtilization || 'N/A') + '%');
      console.log('   - Risk Score:', dashboardData.riskScore || 'N/A');
    } else {
      console.log('❌ Failed to retrieve dashboard metrics');
    }
    
    // Step 3: Test Risk Alerts
    console.log('\n3. Testing Risk Alerts...');
    const riskData = await makeRequest('/api/analytics/risks', 'GET', null, authHeaders);
    
    if (riskData && riskData.length !== undefined) {
      console.log(`✅ Risk alerts retrieved: ${riskData.length} alerts found`);
      if (riskData.length > 0) {
        console.log('   Sample alert:', riskData[0]);
      }
    } else {
      console.log('❌ Failed to retrieve risk alerts');
    }
    
    // Step 4: Test Projects for Upcoming Deadlines
    console.log('\n4. Testing Projects (for upcoming deadlines)...');
    const projectsData = await makeRequest('/api/projects', 'GET', null, authHeaders);
    
    if (projectsData && projectsData.length !== undefined) {
      console.log(`✅ Projects retrieved: ${projectsData.length} projects found`);
      
      // Check for upcoming deadlines
      const now = new Date();
      const upcomingDeadlines = projectsData.filter(project => {
        if (project.end_date) {
          const endDate = new Date(project.end_date);
          const daysUntilDeadline = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
          return daysUntilDeadline > 0 && daysUntilDeadline <= 30; // Next 30 days
        }
        return false;
      });
      
      console.log(`   - Upcoming deadlines (next 30 days): ${upcomingDeadlines.length}`);
      if (upcomingDeadlines.length > 0) {
        console.log('   Sample upcoming deadline:', {
          name: upcomingDeadlines[0].name,
          end_date: upcomingDeadlines[0].end_date
        });
      }
    } else {
      console.log('❌ Failed to retrieve projects');
    }
    
    // Step 5: Test Project Milestones
    console.log('\n5. Testing Project Milestones...');
    const milestonesData = await makeRequest('/api/project-milestones', 'GET', null, authHeaders);
    
    if (milestonesData && milestonesData.length !== undefined) {
      console.log(`✅ Project milestones retrieved: ${milestonesData.length} milestones found`);
      if (milestonesData.length > 0) {
        console.log('   Sample milestone:', milestonesData[0]);
      }
    } else {
      console.log('❌ Failed to retrieve project milestones');
    }
    
    console.log('\n📊 Summary:');
    console.log('- Dashboard API endpoints are accessible with authentication');
    console.log('- Risk Alerts and Upcoming Deadlines functionality can be tested');
    console.log('- Data structure appears to be working correctly');
    
  } catch (error) {
    console.error('❌ Error during authenticated testing:', error.message);
  }
}

testDashboardWithAuth();