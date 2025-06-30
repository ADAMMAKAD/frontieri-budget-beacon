const pool = require('./config/database');

async function testConnection() {
    try {
        console.log('Testing database connection...');
        const result = await pool.query('SELECT NOW() as current_time, COUNT(*) as user_count FROM users');
        console.log('Database connection successful!');
        console.log('Current time:', result.rows[0].current_time);
        console.log('User count:', result.rows[0].user_count);
        
        // Test a simple auth query
        const authTest = await pool.query('SELECT id, email, role FROM users WHERE email = $1', ['admin@pbms.com']);
        console.log('Admin user found:', authTest.rows.length > 0 ? 'Yes' : 'No');
        if (authTest.rows.length > 0) {
            console.log('Admin user details:', authTest.rows[0]);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Database connection failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

testConnection();