const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const BASE_URL = 'http://localhost:3001/api';

async function makeRequest(url) {
  try {
    const { stdout } = await execAsync(`curl -s "${url}"`);
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

async function testDashboardFeatures() {
  console.log('🔍 Testing Dashboard Features: Risk Alerts and Upcoming Deadlines\n');
  
  try {
    // Test 1: Check dashboard metrics endpoint
    console.log('1. Testing Dashboard Metrics Endpoint...');
    const metrics = await makeRequest(`${BASE_URL}/analytics/dashboard`);
    
    console.log('✅ Dashboard metrics retrieved successfully');
    console.log(`   - Active Projects: ${metrics.active_projects}`);
    console.log(`   - Total Budget: $${metrics.total_budget}`);
    console.log(`   - Budget Utilization: ${Math.round(metrics.budget_utilization * 100)}%`);
    console.log(`   - Risk Score: ${metrics.risk_score}`);
    console.log('');
    
    // Test 2: Check risks endpoint for Risk Alerts
    console.log('2. Testing Risk Alerts Endpoint...');
    const risksData = await makeRequest(`${BASE_URL}/analytics/risks`);
    const risks = risksData.risks;
    
    console.log(`✅ Found ${risks.length} risk alerts`);
    risks.forEach((risk, index) => {
      console.log(`   Risk ${index + 1}:`);
      console.log(`   - Type: ${risk.type}`);
      console.log(`   - Severity: ${risk.severity}`);
      console.log(`   - Project: ${risk.project_name}`);
      console.log(`   - Message: ${risk.message}`);
      console.log(`   - Recommendation: ${risk.recommendation}`);
      console.log('');
    });
    
    // Test 3: Check projects for upcoming deadlines
    console.log('3. Testing Upcoming Deadlines...');
    const projects = await makeRequest(`${BASE_URL}/projects`);
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    const upcomingDeadlines = projects.filter(project => {
      if (!project.end_date) return false;
      const endDate = new Date(project.end_date);
      return endDate >= now && endDate <= thirtyDaysFromNow;
    });
    
    console.log(`✅ Found ${upcomingDeadlines.length} projects with upcoming deadlines (within 30 days)`);
    upcomingDeadlines.forEach((project, index) => {
      const endDate = new Date(project.end_date);
      const daysUntilDeadline = Math.ceil((endDate - now) / (24 * 60 * 60 * 1000));
      console.log(`   Deadline ${index + 1}:`);
      console.log(`   - Project: ${project.name}`);
      console.log(`   - End Date: ${endDate.toLocaleDateString()}`);
      console.log(`   - Days Until Deadline: ${daysUntilDeadline}`);
      console.log(`   - Status: ${project.status}`);
      console.log(`   - Budget Utilization: ${Math.round((project.spent_budget / project.total_budget) * 100)}%`);
      console.log('');
    });
    
    // Test 4: Check milestones for deadline tracking
    console.log('4. Testing Project Milestones for Deadline Tracking...');
    const milestones = await makeRequest(`${BASE_URL}/project-milestones`);
    
    const upcomingMilestones = milestones.filter(milestone => {
      if (!milestone.due_date || milestone.status === 'completed') return false;
      const dueDate = new Date(milestone.due_date);
      return dueDate >= now && dueDate <= thirtyDaysFromNow;
    });
    
    console.log(`✅ Found ${upcomingMilestones.length} upcoming milestones (within 30 days)`);
    upcomingMilestones.forEach((milestone, index) => {
      const dueDate = new Date(milestone.due_date);
      const daysUntilDue = Math.ceil((dueDate - now) / (24 * 60 * 60 * 1000));
      console.log(`   Milestone ${index + 1}:`);
      console.log(`   - Title: ${milestone.title}`);
      console.log(`   - Project ID: ${milestone.project_id}`);
      console.log(`   - Due Date: ${dueDate.toLocaleDateString()}`);
      console.log(`   - Days Until Due: ${daysUntilDue}`);
      console.log(`   - Status: ${milestone.status}`);
      console.log('');
    });
    
    // Summary
    console.log('📊 DASHBOARD FEATURES SUMMARY:');
    console.log('================================');
    console.log(`✅ Risk Alerts: ${risks.length} active risks detected`);
    console.log(`✅ Upcoming Deadlines: ${upcomingDeadlines.length} projects ending within 30 days`);
    console.log(`✅ Upcoming Milestones: ${upcomingMilestones.length} milestones due within 30 days`);
    console.log(`✅ Dashboard Metrics: All endpoints working correctly`);
    console.log('');
    
    if (risks.length === 0 && upcomingDeadlines.length === 0) {
      console.log('ℹ️  Note: No immediate risks or deadlines detected.');
      console.log('   This could mean:');
      console.log('   - All projects are well within budget and timeline');
      console.log('   - Project end dates may need to be set closer to current date for testing');
      console.log('   - Consider updating some projects to have higher budget utilization');
    }
    
  } catch (error) {
    console.error('❌ Error testing dashboard features:', error.message);
  }
}

testDashboardFeatures();