// Test script to debug the SQL query for project visibility

const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'pbms_db_new',
    password: '1234567890',
    port: 5432,
});

async function testSQLQuery() {
    try {
        console.log('🔍 Testing SQL query for project visibility...');
        
        // First, let's see what's in the project_teams table
        console.log('\n📋 Current project_teams data:');
        const teamsResult = await pool.query(`
            SELECT pt.*, p.name as project_name, u.email as user_email 
            FROM project_teams pt 
            LEFT JOIN projects p ON pt.project_id = p.id 
            LEFT JOIN users u ON pt.user_id = u.id
            ORDER BY pt.created_at DESC
            LIMIT 10
        `);
        
        console.log('Project teams:', teamsResult.rows.map(row => ({
            project_name: row.project_name,
            user_email: row.user_email,
            role: row.role,
            project_id: row.project_id,
            user_id: row.user_id
        })));
        
        // Get a test user (non-admin)
        const usersResult = await pool.query(`
            SELECT id, email, role FROM users 
            WHERE role != 'admin' AND is_active = true 
            LIMIT 1
        `);
        
        if (usersResult.rows.length === 0) {
            console.log('❌ No non-admin users found');
            return;
        }
        
        const testUser = usersResult.rows[0];
        console.log('\n👤 Test user:', testUser.email, 'ID:', testUser.id);
        
        // Test the exact query from the projects route
        console.log('\n🔍 Testing projects query with role-based filtering...');
        
        const query = `
            SELECT p.*, u.full_name as manager_name, bu.name as business_unit_name,
                   COALESCE(team_counts.team_size, 0) as team_size,
                   COALESCE(expense_totals.spent_budget, 0) as spent_budget
            FROM projects p
            LEFT JOIN users u ON p.project_manager_id = u.id
            LEFT JOIN business_units bu ON p.business_unit_id = bu.id
            LEFT JOIN (
                SELECT project_id, COUNT(user_id) as team_size
                FROM project_teams
                GROUP BY project_id
            ) team_counts ON p.id = team_counts.project_id
            LEFT JOIN (
                SELECT project_id, SUM(CAST(amount AS DECIMAL)) as spent_budget
                FROM expenses
                WHERE status = 'approved'
                GROUP BY project_id
            ) expense_totals ON p.id = expense_totals.project_id
            WHERE 1=1
            AND (p.project_manager_id = $1 OR EXISTS (
                SELECT 1 FROM project_teams pt2 WHERE pt2.project_id = p.id AND pt2.user_id = $2
            ))
            ORDER BY p.created_at DESC
        `;
        
        const result = await pool.query(query, [testUser.id, testUser.id]);
        
        console.log('Projects visible to user:', result.rows.map(row => ({
            id: row.id,
            name: row.name,
            manager_name: row.manager_name,
            team_size: row.team_size
        })));
        
        // Also test without role filtering to see all projects
        console.log('\n🔍 All projects (admin view):');
        const adminQuery = `
            SELECT p.*, u.full_name as manager_name, bu.name as business_unit_name,
                   COALESCE(team_counts.team_size, 0) as team_size,
                   COALESCE(expense_totals.spent_budget, 0) as spent_budget
            FROM projects p
            LEFT JOIN users u ON p.project_manager_id = u.id
            LEFT JOIN business_units bu ON p.business_unit_id = bu.id
            LEFT JOIN (
                SELECT project_id, COUNT(user_id) as team_size
                FROM project_teams
                GROUP BY project_id
            ) team_counts ON p.id = team_counts.project_id
            LEFT JOIN (
                SELECT project_id, SUM(CAST(amount AS DECIMAL)) as spent_budget
                FROM expenses
                WHERE status = 'approved'
                GROUP BY project_id
            ) expense_totals ON p.id = expense_totals.project_id
            WHERE 1=1
            ORDER BY p.created_at DESC
        `;
        
        const adminResult = await pool.query(adminQuery);
        
        console.log('All projects:', adminResult.rows.map(row => ({
            id: row.id,
            name: row.name,
            manager_name: row.manager_name,
            team_size: row.team_size
        })));
        
        // Test the EXISTS subquery directly
        console.log('\n🔍 Testing EXISTS subquery directly...');
        const existsQuery = `
            SELECT p.id, p.name,
                   (p.project_manager_id = $1) as is_manager,
                   EXISTS (
                       SELECT 1 FROM project_teams pt2 
                       WHERE pt2.project_id = p.id AND pt2.user_id = $2
                   ) as is_team_member
            FROM projects p
            ORDER BY p.created_at DESC
        `;
        
        const existsResult = await pool.query(existsQuery, [testUser.id, testUser.id]);
        
        console.log('Project access check:', existsResult.rows.map(row => ({
            id: row.id,
            name: row.name,
            is_manager: row.is_manager,
            is_team_member: row.is_team_member,
            should_see: row.is_manager || row.is_team_member
        })));
        
    } catch (error) {
        console.error('❌ SQL test failed:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

testSQLQuery();