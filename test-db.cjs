require('dotenv').config({ path: './backend/.env' });
const pool = require('./backend/config/database');

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT email, full_name FROM users LIMIT 5');
    console.log('Users found:', result.rows);
    
    // Check if admin user exists
    const adminResult = await pool.query('SELECT email, full_name FROM users WHERE email = $1', ['admin@test.com']);
    console.log('Admin user:', adminResult.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Database error:', error);
    process.exit(1);
  }
}

testDatabase();