require('dotenv').config({ path: './backend/.env' });
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function testProjectCreation() {
  try {
    console.log('Testing project creation...');
    
    // First, check if there are any business units
    const businessUnitsResult = await pool.query('SELECT * FROM business_units');
    console.log('Business units found:', businessUnitsResult.rows.length);
    
    if (businessUnitsResult.rows.length === 0) {
      console.log('No business units found. Creating a test business unit...');
      
      // Get admin user ID
      const adminResult = await pool.query("SELECT id FROM users WHERE email = 'admin@test.com'");
      const adminId = adminResult.rows[0]?.id;
      
      if (adminId) {
        const newBusinessUnit = await pool.query(
          'INSERT INTO business_units (name, description, manager_id) VALUES ($1, $2, $3) RETURNING *',
          ['IT Department', 'Information Technology Department', adminId]
        );
        console.log('Created business unit:', newBusinessUnit.rows[0]);
      }
    } else {
      console.log('Existing business units:', businessUnitsResult.rows);
    }
    
    // Now try to create a test project
    const adminResult = await pool.query("SELECT id FROM users WHERE email = 'admin@test.com'");
    const adminId = adminResult.rows[0]?.id;
    
    const businessUnitResult = await pool.query('SELECT id FROM business_units LIMIT 1');
    const businessUnitId = businessUnitResult.rows[0]?.id;
    
    if (adminId && businessUnitId) {
      console.log('Attempting to create test project...');
      
      const projectResult = await pool.query(
        `INSERT INTO projects (name, description, total_budget, start_date, end_date, 
         department, project_manager_id, business_unit_id, allocated_budget)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $3) RETURNING *`,
        [
          'Test Project',
          'A test project for debugging',
          10000.00,
          '2024-01-01',
          '2024-12-31',
          'IT',
          adminId,
          businessUnitId
        ]
      );
      
      console.log('Project created successfully:', projectResult.rows[0]);
    } else {
      console.log('Missing required data:', { adminId, businessUnitId });
    }
    
  } catch (error) {
    console.error('Error during project creation test:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

testProjectCreation();