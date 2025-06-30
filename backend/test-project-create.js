require('dotenv').config();
const pool = require('./config/database');
const jwt = require('jsonwebtoken');

async function testProjectCreation() {
    try {
        // Get admin user for authentication
        const adminResult = await pool.query(
            "SELECT id, email, role FROM users WHERE role = 'admin' LIMIT 1"
        );
        
        if (adminResult.rows.length === 0) {
            throw new Error('No admin user found');
        }
        
        const adminUser = adminResult.rows[0];
        console.log('Using admin user:', adminUser);
        
        // Test project data
        const projectData = {
            name: 'Test Project',
            description: 'Test Description',
            total_budget: 10000,
            currency: 'USD',
            start_date: '2024-01-01',
            end_date: '2024-12-31',
            department: 'IT',
            business_unit_id: null // This might be the issue
        };
        
        console.log('Attempting to create project with data:', projectData);
        
        // Try the exact query from the route
        const result = await pool.query(
            `INSERT INTO projects (name, description, total_budget, currency, start_date, end_date, 
             department, project_manager_id, business_unit_id, allocated_budget)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $3) RETURNING *`,
            [
                projectData.name,
                projectData.description,
                projectData.total_budget,
                projectData.currency,
                projectData.start_date,
                projectData.end_date,
                projectData.department,
                adminUser.id,
                projectData.business_unit_id
            ]
        );
        
        console.log('Project created successfully:', result.rows[0]);
        
    } catch (error) {
        console.error('Error creating project:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            hint: error.hint,
            position: error.position
        });
    } finally {
        process.exit(0);
    }
}

testProjectCreation();