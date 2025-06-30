const pool = require('./config/database');

async function checkUsers() {
    try {
        const result = await pool.query('SELECT id, email, full_name, role FROM users LIMIT 5');
        console.log('👥 Users in database:');
        console.table(result.rows);
        
        if (result.rows.length === 0) {
            console.log('❌ No users found in database');
            console.log('💡 You need to create a user account first');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error checking users:', error.message);
        process.exit(1);
    }
}

checkUsers();