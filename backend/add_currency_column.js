const fs = require('fs');
const path = require('path');
// Explicitly load .env from the backend directory
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const pool = require('./config/database');

async function addCurrencyColumn() {
    try {
        console.log('Checking and adding currency column to projects table...');
        
        const client = await pool.connect();
        
        try {
            // Check if currency column exists
            const checkColumnQuery = `
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'projects' AND column_name = 'currency';
            `;
            
            const columnResult = await client.query(checkColumnQuery);
            
            if (columnResult.rows.length === 0) {
                // Add currency column if it doesn't exist
                const addColumnQuery = `
                    ALTER TABLE projects 
                    ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';
                `;
                
                await client.query(addColumnQuery);
                console.log('✅ Currency column added successfully!');
            } else {
                console.log('✅ Currency column already exists!');
            }
            
            // Check current projects in the table
            const projectsQuery = 'SELECT id, name, currency, created_at FROM projects ORDER BY created_at DESC LIMIT 10;';
            const projectsResult = await client.query(projectsQuery);
            
            console.log('\n📋 Current projects in database:');
            if (projectsResult.rows.length === 0) {
                console.log('No projects found in the database.');
            } else {
                projectsResult.rows.forEach((project, index) => {
                    console.log(`${index + 1}. ${project.name} (${project.currency || 'No currency'}) - Created: ${project.created_at}`);
                });
            }
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    addCurrencyColumn();
}

module.exports = addCurrencyColumn;