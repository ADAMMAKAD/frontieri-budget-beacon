const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function testProjectsEndpoint() {
  try {
    console.log('🔐 Getting authentication token...');
    
    // Login to get token
    const loginCmd = `curl -s -X POST -H "Content-Type: application/json" -d '{"email":"admin@pbms.com","password":"password"}' http://localhost:3001/auth/login`;
    const { stdout: loginResponse } = await execPromise(loginCmd);
    
    const loginData = JSON.parse(loginResponse);
    if (!loginData.token) {
      console.log('❌ Failed to get authentication token');
      return;
    }
    
    console.log('✅ Authentication successful');
    
    // Test projects endpoint
    console.log('\n📅 Testing Projects endpoint (for upcoming deadlines)...');
    const projectsCmd = `curl -s -H "Authorization: Bearer ${loginData.token}" http://localhost:3001/api/projects`;
    const { stdout: projectsResponse } = await execPromise(projectsCmd);
    
    console.log('Raw response length:', projectsResponse.length);
    
    try {
      const projectsData = JSON.parse(projectsResponse);
      console.log('✅ Projects endpoint working!');
      console.log('Number of projects:', projectsData.length || 0);
      
      if (projectsData.length > 0) {
        console.log('Sample project:', {
          name: projectsData[0].name,
          status: projectsData[0].status,
          end_date: projectsData[0].end_date
        });
        
        // Check for upcoming deadlines
        const now = new Date();
        const upcomingDeadlines = projectsData.filter(project => {
          if (project.end_date) {
            const endDate = new Date(project.end_date);
            const daysUntilDeadline = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
            return daysUntilDeadline > 0 && daysUntilDeadline <= 30;
          }
          return false;
        });
        
        console.log(`📅 Upcoming deadlines (next 30 days): ${upcomingDeadlines.length}`);
      }
    } catch (parseError) {
      console.log('❌ Failed to parse projects response as JSON');
      console.log('Parse error:', parseError.message);
      console.log('Response preview:', projectsResponse.substring(0, 200));
    }
    
    // Test project milestones endpoint
    console.log('\n🎯 Testing Project Milestones endpoint...');
    const milestonesCmd = `curl -s -H "Authorization: Bearer ${loginData.token}" http://localhost:3001/api/project-milestones`;
    const { stdout: milestonesResponse } = await execPromise(milestonesCmd);
    
    try {
      const milestonesData = JSON.parse(milestonesResponse);
      console.log('✅ Project milestones endpoint working!');
      console.log('Number of milestones:', milestonesData.length || 0);
      
      if (milestonesData.length > 0) {
        console.log('Sample milestone:', {
          title: milestonesData[0].title,
          due_date: milestonesData[0].due_date,
          status: milestonesData[0].status
        });
      }
    } catch (parseError) {
      console.log('❌ Failed to parse milestones response as JSON');
      console.log('Parse error:', parseError.message);
      console.log('Response preview:', milestonesResponse.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
  }
}

testProjectsEndpoint();