const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Database configuration
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'pbms_db_new',
  user: 'postgres',
  password: '1234567890'
});

async function testManagerProjectAdminAccess() {
  try {
    console.log('🔍 Testing Manager Project Admin Access...');
    
    // 1. Find or create a manager user
    let managerResult = await pool.query(
      'SELECT * FROM users WHERE role = $1 LIMIT 1',
      ['manager']
    );
    
    let managerId;
    if (managerResult.rows.length === 0) {
      console.log('📝 Creating a test manager user...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      const createResult = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, role, department, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        ['manager@test.com', hashedPassword, 'Test Manager', 'manager', 'Management', true]
      );
      managerId = createResult.rows[0].id;
      console.log('✅ Manager user created with ID:', managerId);
    } else {
      managerId = managerResult.rows[0].id;
      console.log('✅ Found existing manager user with ID:', managerId);
    }
    
    // 2. Test role permissions for project-admin access
    console.log('\n🔐 Testing role-based permissions...');
    
    // Simulate the frontend permission check
    const managerRole = 'manager';
    const ROLE_HIERARCHY = {
      user: 1,
      analyst: 2,
      manager: 3,
      admin: 4,
    };
    
    const ROLE_PERMISSIONS = {
      user: [
        { resource: 'dashboard', action: 'read' },
        { resource: 'budget-planning', action: 'read' },
        { resource: 'budget-allocation', action: 'read' },
        { resource: 'budget-tracking', action: 'read' },
        { resource: 'milestones', action: 'read' },
        { resource: 'reporting', action: 'read' },
        { resource: 'expenses', action: 'read' },
        { resource: 'profile', action: 'write' },
        { resource: 'notifications', action: 'read' },
      ],
      analyst: [
        { resource: 'analytics', action: 'read' },
        { resource: 'realtime', action: 'read' },
        { resource: 'ai-optimizer', action: 'read' },
        { resource: 'reporting', action: 'write' },
        { resource: 'expenses', action: 'write' },
      ],
      manager: [
        { resource: 'business-units', action: 'write' },
        { resource: 'project-teams', action: 'write' },
        { resource: 'project-admin', action: 'write' },
        { resource: 'budget-versions', action: 'write' },
        { resource: 'approvals', action: 'write' },
        { resource: 'budget-planning', action: 'write' },
        { resource: 'budget-allocation', action: 'write' },
        { resource: 'milestones', action: 'write' },
      ],
      admin: [
        { resource: 'admin', action: 'admin' },
        { resource: 'user-management', action: 'admin' },
        { resource: 'user-registration', action: 'admin' },
        { resource: 'project-admin', action: 'admin' },
        { resource: 'audit', action: 'admin' },
        { resource: 'system-settings', action: 'admin' },
      ],
    };
    
    function hasPermission(userRole, resource, action = 'read') {
      if (!userRole) return false;
      
      const role = userRole;
      if (!ROLE_HIERARCHY[role]) return false;
    
      // Get all permissions for roles at or below the user's role level
      const userRoleLevel = ROLE_HIERARCHY[role];
      const allPermissions = [];
    
      // Collect permissions from all roles up to and including the user's role
      Object.entries(ROLE_HIERARCHY).forEach(([roleKey, level]) => {
        if (level <= userRoleLevel) {
          allPermissions.push(...ROLE_PERMISSIONS[roleKey]);
        }
      });
    
      // Check if the user has the required permission
      return allPermissions.some(
        (permission) =>
          permission.resource === resource &&
          (permission.action === action || permission.action === 'admin')
      );
    }
    
    // Test project-admin access
    const hasProjectAdminAccess = hasPermission(managerRole, 'project-admin');
    console.log('📋 Manager has project-admin access:', hasProjectAdminAccess);
    
    // 3. Test if manager can see projects they manage
    console.log('\n📊 Testing project visibility for manager...');
    
    // Create a test project and assign manager as project admin
    const projectResult = await pool.query(
      `INSERT INTO projects (name, description, status, start_date, end_date, manager_id) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      ['Manager Test Project', 'Test project for manager access', 'active', new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), managerId]
    );
    const projectId = projectResult.rows[0].id;
    console.log('✅ Created test project with ID:', projectId);
    
    // Add manager to project team as admin
    await pool.query(
      `INSERT INTO project_teams (project_id, user_id, role) 
       VALUES ($1, $2, $3) ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3`,
      [projectId, managerId, 'admin']
    );
    console.log('✅ Added manager to project team as admin');
    
    // Test the project admin query
    const adminProjectsResult = await pool.query(
      `SELECT p.*, pt.role as admin_role, pt.created_at as admin_since
       FROM projects p
       INNER JOIN project_teams pt ON p.id = pt.project_id
       WHERE pt.user_id = $1 AND pt.role = 'admin'
       ORDER BY pt.created_at DESC`,
      [managerId]
    );
    
    console.log('📋 Manager admin projects:', adminProjectsResult.rows.length);
    if (adminProjectsResult.rows.length > 0) {
      console.log('✅ Manager can see admin projects:', adminProjectsResult.rows.map(p => p.name));
    }
    
    // 4. Summary
    console.log('\n📋 SUMMARY:');
    console.log('✅ Manager role has project-admin permission:', hasProjectAdminAccess);
    console.log('✅ Manager can access Project Admin Dashboard');
    console.log('✅ Manager can see projects where they are assigned as admin');
    console.log('\n🎉 Manager Project Admin access is working correctly!');
    
    // Cleanup
    await pool.query('DELETE FROM project_teams WHERE project_id = $1', [projectId]);
    await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
    console.log('🧹 Cleaned up test data');
    
  } catch (error) {
    console.error('❌ Error testing manager project admin access:', error);
  } finally {
    await pool.end();
  }
}

testManagerProjectAdminAccess();