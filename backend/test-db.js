const pool = require('./config/database');

async function testConnection() {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('✅ Database connected successfully:', result.rows[0]);
        
        // Test projects table
        const projects = await pool.query('SELECT COUNT(*) FROM projects');
        console.log('📊 Projects count:', projects.rows[0].count);
        
        // Test business_units table
        const businessUnits = await pool.query('SELECT COUNT(*) FROM business_units');
        console.log('🏢 Business units count:', businessUnits.rows[0].count);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

testConnection();