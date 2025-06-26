const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'pbms_db_new',
  password: process.env.DB_PASSWORD || '1234567890',
  port: process.env.DB_PORT || 5432,
});

// Sample notification data
const sampleNotifications = [
  {
    title: 'Expense Approval Required',
    message: 'Your expense report for $2,450.00 requires approval from your manager.',
    type: 'warning',
    action_url: '/expenses/123'
  },
  {
    title: 'Budget Alert: Marketing Overspend',
    message: 'Marketing budget has exceeded 85% of allocated funds for Q2.',
    type: 'warning',
    action_url: '/budgets/marketing'
  },
  {
    title: 'Project Deadline Approaching',
    message: 'Website Redesign project deadline is in 3 days. Current progress: 75%',
    type: 'warning',
    action_url: '/projects/456'
  },
  {
    title: 'New Team Member Added',
    message: 'Sarah Johnson has been added to the Development team.',
    type: 'info',
    action_url: '/team/789'
  },
  {
    title: 'System Maintenance Scheduled',
    message: 'Scheduled system maintenance will occur on Sunday, 2:00 AM - 4:00 AM EST.',
    type: 'info',
    action_url: null
  },
  {
    title: 'Monthly Report Generated',
    message: 'Your monthly financial report for May 2024 is now available.',
    type: 'success',
    action_url: '/reports/monthly/may-2024'
  },
  {
    title: 'Budget Approved',
    message: 'Q3 Marketing budget of $15,000 has been approved by finance team.',
    type: 'success',
    action_url: '/budgets/q3-marketing'
  },
  {
    title: 'Expense Rejected',
    message: 'Your travel expense claim has been rejected. Reason: Missing receipts.',
    type: 'error',
    action_url: '/expenses/789'
  },
  {
    title: 'Achievement Unlocked',
    message: 'Congratulations! You\'ve completed 50 expense reports this quarter.',
    type: 'success',
    action_url: null
  },
  {
    title: 'Critical Budget Warning',
    message: 'IT Infrastructure budget has exceeded 95% allocation. Immediate action required.',
    type: 'error',
    action_url: '/budgets/it-infrastructure'
  }
];

async function createSampleNotifications() {
  try {
    console.log('Creating sample notifications...');
    
    // Get all active users
    const usersResult = await pool.query('SELECT id FROM users WHERE is_active = true LIMIT 5');
    const users = usersResult.rows;
    
    if (users.length === 0) {
      console.log('No active users found. Please create some users first.');
      return;
    }
    
    console.log(`Found ${users.length} active users`);
    
    // Create notifications for each user
    for (const user of users) {
      // Create 3-5 random notifications per user
      const notificationCount = Math.floor(Math.random() * 3) + 3;
      const userNotifications = sampleNotifications
        .sort(() => 0.5 - Math.random())
        .slice(0, notificationCount);
      
      for (const notification of userNotifications) {
        const createdAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Random time in last 7 days
        const read = Math.random() > 0.6; // 40% chance of being read
        
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, read, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [user.id, notification.title, notification.message, notification.type, read, createdAt]
        );
      }
      
      console.log(`Created ${notificationCount} notifications for user ${user.id}`);
    }
    
    console.log('Sample notifications created successfully!');
    
  } catch (error) {
    console.error('Error creating sample notifications:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  createSampleNotifications();
}

module.exports = { createSampleNotifications };