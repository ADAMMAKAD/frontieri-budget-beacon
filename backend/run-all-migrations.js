const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const pool = require('./config/database');

async function runAllMigrations() {
    try {
        console.log('🚀 Starting complete database migration process...');
        
        // Get all migration files in order
        const migrationFiles = [
            '001_initial_schema.sql',
            '002_add_currency_to_projects.sql',
            '003_add_project_admin_role.sql'
        ];
        
        const client = await pool.connect();
        
        try {
            // Create migrations tracking table if it doesn't exist
            await client.query(`
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    version VARCHAR(255) PRIMARY KEY,
                    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            `);
            
            console.log('📋 Checking existing migrations...');
            
            for (const migrationFile of migrationFiles) {
                const version = migrationFile.replace('.sql', '');
                
                // Check if migration already applied
                const result = await client.query(
                    'SELECT version FROM schema_migrations WHERE version = $1',
                    [version]
                );
                
                if (result.rows.length > 0) {
                    console.log(`⏭️  Skipping ${migrationFile} - already applied`);
                    continue;
                }
                
                console.log(`🔄 Applying migration: ${migrationFile}`);
                
                const migrationPath = path.join(__dirname, 'migrations', migrationFile);
                
                if (!fs.existsSync(migrationPath)) {
                    console.log(`⚠️  Migration file not found: ${migrationFile}`);
                    continue;
                }
                
                const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
                
                // Split by semicolon and filter out empty statements
                const statements = migrationSQL
                    .split(';')
                    .filter(statement => statement.trim().length > 0);
                
                await client.query('BEGIN');
                
                try {
                    for (const statement of statements) {
                        if (statement.trim()) {
                            try {
                                await client.query(statement);
                                console.log(`  ✅ Executed: ${statement.split('\n')[0].trim().substring(0, 50)}...`);
                            } catch (error) {
                                // Skip if table/column already exists
                                if (error.message.includes('already exists') || 
                                    error.message.includes('duplicate column')) {
                                    console.log(`  ⏭️  Skipped (already exists): ${statement.split('\n')[0].trim().substring(0, 50)}...`);
                                } else {
                                    throw error;
                                }
                            }
                        }
                    }
                    
                    // Mark migration as applied
                    await client.query(
                        'INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING',
                        [version]
                    );
                    
                    await client.query('COMMIT');
                    console.log(`✅ Migration ${migrationFile} completed successfully!`);
                    
                } catch (error) {
                    await client.query('ROLLBACK');
                    throw error;
                }
            }
            
            console.log('\n🎉 All migrations completed successfully!');
            
            // Show final migration status
            const appliedMigrations = await client.query(
                'SELECT version, applied_at FROM schema_migrations ORDER BY version'
            );
            
            console.log('\n📊 Applied migrations:');
            appliedMigrations.rows.forEach(row => {
                console.log(`  ✅ ${row.version} - ${row.applied_at}`);
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Migration process failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    runAllMigrations();
}

module.exports = runAllMigrations;