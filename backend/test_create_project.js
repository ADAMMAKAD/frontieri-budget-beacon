const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const pool = require('./config/database');
const jwt = require('jsonwebtoken');

async function testCreateProject() {
    try {
        console.log('Testing project creation...');
        
        const client = await pool.connect();
        
        try {
            // First, let's check if we have any users to use as project manager
            const usersQuery = 'SELECT id, email FROM users LIMIT 1;';
            const usersResult = await client.query(usersQuery);
            
            if (usersResult.rows.length === 0) {
                console.log('❌ No users found in database. Creating a test user...');
                
                // Create a test user
                const createUserQuery = `
                    INSERT INTO users (id, email, password_hash, full_name, role) 
                    VALUES (gen_random_uuid(), 'test@example.com', 'test_hash', 'Test User', 'admin') 
                    RETURNING id, email;
                `;
                const newUserResult = await client.query(createUserQuery);
                console.log('✅ Test user created:', newUserResult.rows[0]);
            }
            
            // Get the first user
            const userResult = await client.query(usersQuery);
            const testUser = userResult.rows[0];
            console.log('👤 Using user:', testUser);
            
            // Test direct database insertion
            const testProjectData = {
                name: 'Direct DB Test Project',
                description: 'Testing direct database insertion',
                total_budget: 15000,
                currency: 'USD',
                start_date: '2025-01-01',
                end_date: '2025-12-31',
                department: 'IT',
                project_manager_id: testUser.id
            };
            
            const insertQuery = `
                INSERT INTO projects (name, description, total_budget, currency, start_date, end_date, 
                                    department, project_manager_id, allocated_budget)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $3) 
                RETURNING *;
            `;
            
            const insertResult = await client.query(insertQuery, [
                testProjectData.name,
                testProjectData.description,
                testProjectData.total_budget,
                testProjectData.currency,
                testProjectData.start_date,
                testProjectData.end_date,
                testProjectData.department,
                testProjectData.project_manager_id
            ]);
            
            console.log('✅ Project created successfully:');
            console.log(insertResult.rows[0]);
            
            // Now test the API endpoint simulation
            console.log('\n🔄 Testing API endpoint logic...');
            
            // Generate a test JWT token
            const testToken = jwt.sign(
                { id: testUser.id, email: testUser.email, role: 'admin' },
                process.env.JWT_SECRET || 'test_secret',
                { expiresIn: '1h' }
            );
            
            console.log('🔑 Generated test token:', testToken.substring(0, 50) + '...');
            
            // Verify the token
            const decoded = jwt.verify(testToken, process.env.JWT_SECRET || 'test_secret');
            console.log('✅ Token verified:', { id: decoded.id, email: decoded.email });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    testCreateProject();
}

module.exports = testCreateProject;