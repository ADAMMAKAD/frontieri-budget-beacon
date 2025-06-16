
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runMigrations() {
    try {
        console.log('Starting database migrations...');
        
        // Read migration file
        const migrationPath = path.join(__dirname, '001_initial_schema.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Split by semicolon and filter out empty statements
        const statements = migrationSQL
            .split(';')
            .filter(statement => statement.trim().length > 0);
        
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            for (const statement of statements) {
                if (statement.trim()) {
                    await client.query(statement);
                    console.log('Executed:', statement.split('\n')[0].trim().substring(0, 50) + '...');
                }
            }
            
            await client.query('COMMIT');
            console.log('✅ All migrations completed successfully!');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    runMigrations();
}

module.exports = runMigrations;
