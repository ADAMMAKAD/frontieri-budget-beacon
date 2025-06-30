const pool = require('./config/database');
const bcrypt = require('bcryptjs');

async function checkCredentials() {
    try {
        // Check if admin user exists
        const result = await pool.query(
            'SELECT id, email, password_hash, role FROM users WHERE email = $1',
            ['admin@pbms.com']
        );
        
        if (result.rows.length === 0) {
            console.log('❌ Admin user not found in database');
            return;
        }
        
        const user = result.rows[0];
        console.log('✅ Admin user found:');
        console.log('- Email:', user.email);
        console.log('- Role:', user.role);
        // console.log('- Status:', user.status);
        console.log('- Password hash exists:', !!user.password_hash);
        
        // Test password verification
        const testPassword = 'password';
        const isValid = await bcrypt.compare(testPassword, user.password_hash);
        console.log('- Password "password" is valid:', isValid);
        
        if (!isValid) {
            console.log('\n🔧 Updating password to "password"...');
            const newHash = await bcrypt.hash('password', 10);
            await pool.query(
                'UPDATE users SET password_hash = $1 WHERE email = $2',
                [newHash, 'admin@pbms.com']
            );
            console.log('✅ Password updated successfully');
        }
        
    } catch (error) {
        console.error('❌ Error checking credentials:', error.message);
    } finally {
        await pool.end();
    }
}

checkCredentials();