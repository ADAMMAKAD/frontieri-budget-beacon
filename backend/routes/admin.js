const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get activity log
router.get('/activity-log', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { limit = 100, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await pool.query(
      `SELECT aal.*, u.full_name as admin_name
       FROM admin_activity_log aal
       LEFT JOIN users u ON aal.admin_id = u.id
       ORDER BY aal.created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM admin_activity_log'
    );
    
    res.json({ 
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all expenses with project and user details
router.get('/expenses', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { status, project_id, limit = 50, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT e.*, p.name as project_name, 
             u1.full_name as submitted_by_name,
             u2.full_name as approved_by_name,
             bc.name as category_name
      FROM expenses e
      LEFT JOIN projects p ON e.project_id = p.id
      LEFT JOIN users u1 ON e.submitted_by = u1.id
      LEFT JOIN users u2 ON e.approved_by = u2.id
      LEFT JOIN budget_categories bc ON e.category_id = bc.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (status && status !== 'all') {
      paramCount++;
      query += ` AND e.status = $${paramCount}`;
      params.push(status);
    }
    
    if (project_id) {
      paramCount++;
      query += ` AND e.project_id = $${paramCount}`;
      params.push(project_id);
    }
    
    query += ` ORDER BY e.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) FROM').replace(/ORDER BY.*?LIMIT.*?OFFSET.*$/, '');
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    
    res.json({
      expenses: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all users for admin management
router.get('/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { role, department, limit = 50, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT u.id, u.email, u.full_name, u.department, u.role, u.is_active, u.created_at,
             p.phone, p.avatar_url, bu.name as team_name
      FROM users u
      LEFT JOIN profiles p ON u.id = p.id
      LEFT JOIN business_units bu ON p.team_id = bu.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (role && role !== 'all') {
      paramCount++;
      query += ` AND u.role = $${paramCount}`;
      params.push(role);
    }
    
    if (department && department !== 'all') {
      paramCount++;
      query += ` AND u.department = $${paramCount}`;
      params.push(department);
    }
    
    query += ` ORDER BY u.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) FROM').replace(/ORDER BY.*?LIMIT.*?OFFSET.*$/, '');
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    
    res.json({
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user role/status
router.put('/users/:id', authenticateToken, requireRole(['admin']), [
  body('role').optional().isIn(['admin', 'manager', 'user', 'viewer']),
  body('is_active').optional().isBoolean(),
  body('department').optional().trim(),
  body('team_id').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { team_id, ...requestBody } = req.body;
    
    // Extract only valid user table fields
    const validUserFields = ['email', 'full_name', 'role', 'is_active', 'department'];
    const userUpdates = {};
    
    validUserFields.forEach(field => {
      if (requestBody[field] !== undefined) {
        userUpdates[field] = requestBody[field];
      }
    });
    
    // Don't allow admin to deactivate themselves
    if (id === req.user.id && userUpdates.is_active === false) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      let result;
      
      // Update user table if there are user updates
      if (Object.keys(userUpdates).length > 0) {
        const setClause = Object.keys(userUpdates)
          .map((key, index) => `${key} = $${index + 2}`)
          .join(', ');
        
        const values = [id, ...Object.values(userUpdates)];
        
        const query = `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`;
        result = await client.query(query, values);
        
        if (result.rows.length === 0) {
          throw new Error('User not found');
        }
      } else {
        // Just get the user if no user updates
        result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) {
          throw new Error('User not found');
        }
      }
      
      // Update profile team_id if provided
      if (team_id !== undefined) {
        await client.query(
          'INSERT INTO profiles (id, team_id, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (id) DO UPDATE SET team_id = $2, updated_at = NOW()',
          [id, team_id]
        );
      }
      
      await client.query('COMMIT');
       
       // Log admin activity
       await pool.query(
         'INSERT INTO admin_activity_log (admin_id, action, target_table, target_id, details) VALUES ($1, $2, $3, $4, $5)',
         [req.user.id, 'UPDATE_USER', 'users', id, JSON.stringify(req.body)]
       );
       
       res.json({ user: result.rows[0] });
     } catch (error) {
       await client.query('ROLLBACK');
       throw error;
     } finally {
       client.release();
     }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new user
router.post('/users', authenticateToken, requireRole(['admin']), [
  body('email').isEmail().normalizeEmail(),
  body('full_name').trim().isLength({ min: 1 }),
  body('role').isIn(['admin', 'manager', 'user', 'viewer']),
  body('status').optional().isIn(['active', 'inactive']),
  body('team_id').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, full_name, role, status = 'active', team_id } = req.body;
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if user already exists
      const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        throw new Error('User with this email already exists');
      }
      
      // Create user with default password (they'll need to reset it)
      const defaultPassword = 'TempPassword123!';
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      const result = await client.query(
        `INSERT INTO users (email, password_hash, full_name, role, is_active, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
         RETURNING id, email, full_name, role, is_active, created_at`,
        [email, hashedPassword, full_name, role, status === 'active']
      );
      
      const userId = result.rows[0].id;
      
      // Create profile with team_id if provided
      if (team_id) {
        await client.query(
          'INSERT INTO profiles (id, team_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
          [userId, team_id]
        );
      }
      
      await client.query('COMMIT');
      
      // Log admin activity
      await pool.query(
        'INSERT INTO admin_activity_log (admin_id, action, target_table, target_id, details) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, 'CREATE_USER', 'users', userId, JSON.stringify({ email, full_name, role, is_active: status === 'active', team_id })]
      );
      
      res.status(201).json({ 
        user: result.rows[0],
        message: 'User created successfully. Default password is: TempPassword123!' 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.message === 'User with this email already exists') {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    // Don't allow admin to delete themselves
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Check if user exists
    const userCheck = await client.query('SELECT id, email FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Start transaction
    await client.query('BEGIN');
    
    // Check if user has any critical dependencies that should prevent deletion
    const criticalDependencies = await client.query(
      `SELECT 
        (SELECT COUNT(*) FROM projects WHERE project_manager_id = $1) as managed_projects,
        (SELECT COUNT(*) FROM expenses WHERE submitted_by = $1 AND status = 'pending') as pending_expenses
      `,
      [id]
    );
    
    const { managed_projects, pending_expenses } = criticalDependencies.rows[0];
    
    if (parseInt(managed_projects) > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Cannot delete user who is managing active projects. Please reassign project management first.' 
      });
    }
    
    if (parseInt(pending_expenses) > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Cannot delete user who has pending expenses. Please process all pending expenses first.' 
      });
    }
    
    // Delete related records in the correct order to avoid foreign key violations
    
    // 1. Delete from profiles table (has direct FK to users)
    await client.query('DELETE FROM profiles WHERE id = $1', [id]);
    
    // 2. Delete from user_roles table
    await client.query('DELETE FROM user_roles WHERE user_id = $1', [id]);
    
    // 3. Delete from project_teams table
    await client.query('DELETE FROM project_teams WHERE user_id = $1', [id]);
    
    // 4. Update foreign key references to NULL where appropriate
    // Update expenses where user was the approver (set approved_by to NULL)
    await client.query('UPDATE expenses SET approved_by = NULL WHERE approved_by = $1', [id]);
    
    // Update budget_versions where user was creator or approver
    await client.query('UPDATE budget_versions SET created_by = NULL WHERE created_by = $1', [id]);
    await client.query('UPDATE budget_versions SET approved_by = NULL WHERE approved_by = $1', [id]);
    
    // Update project_milestones where user was creator
    await client.query('UPDATE project_milestones SET created_by = NULL WHERE created_by = $1', [id]);
    
    // Update business_units where user was manager
    await client.query('UPDATE business_units SET manager_id = NULL WHERE manager_id = $1', [id]);
    
    // Update approval_workflows where user was approver
    await client.query('UPDATE approval_workflows SET approver_id = NULL WHERE approver_id = $1', [id]);
    
    // Update user_roles where user was the one who assigned roles
    await client.query('UPDATE user_roles SET assigned_by = NULL WHERE assigned_by = $1', [id]);
    
    // 5. Delete notifications for this user
    await client.query('DELETE FROM notifications WHERE user_id = $1', [id]);
    
    // 6. Finally, delete the user
    await client.query('DELETE FROM users WHERE id = $1', [id]);
    
    // Commit transaction
    await client.query('COMMIT');
    
    // Log admin activity
    await pool.query(
      'INSERT INTO admin_activity_log (admin_id, action, target_table, target_id, details) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'DELETE_USER', 'users', id, JSON.stringify({ email: userCheck.rows[0].email })]
    );
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error deleting user:', error);
    
    // Provide more specific error messages
    if (error.code === '23503') {
      res.status(400).json({ 
        error: 'Cannot delete user due to existing dependencies. Please contact system administrator.' 
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  } finally {
    client.release();
  }
});

// Get system overview metrics
router.get('/overview', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const metricsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
        (SELECT COUNT(*) FROM projects) as total_projects,
        (SELECT COUNT(*) FROM projects WHERE status = 'active') as active_projects,
        (SELECT COUNT(*) FROM expenses WHERE status = 'pending') as pending_expenses,
        (SELECT COALESCE(SUM(total_budget), 0) FROM projects) as total_budget,
        (SELECT COALESCE(SUM(spent_budget), 0) FROM projects) as total_spent,
        (SELECT COUNT(*) FROM business_units) as business_units_count,
        (SELECT COUNT(*) FROM notifications WHERE read = false) as unread_notifications
    `;
    
    const result = await pool.query(metricsQuery);
    const metrics = result.rows[0];
    
    // Calculate budget utilization
    const budgetUtilization = metrics.total_budget > 0 
      ? (metrics.total_spent / metrics.total_budget * 100).toFixed(1)
      : 0;
    
    res.json({
      ...metrics,
      budget_utilization: parseFloat(budgetUtilization)
    });
  } catch (error) {
    console.error('Error fetching overview:', error);
    res.status(500).json({ error: error.message });
  }
});

// Approve/reject expense
router.put('/expenses/:id/approve', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body; // status: 'approved' or 'rejected'
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const result = await pool.query(
      'UPDATE expenses SET status = $1, approved_by = $2 WHERE id = $3 RETURNING *',
      [status, req.user.id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    // Create notification for submitter
    const expense = result.rows[0];
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
      [
        expense.submitted_by,
        `Expense ${status}`,
        `Your expense "${expense.description}" has been ${status}`,
        status === 'approved' ? 'success' : 'warning'
      ]
    );
    
    // Log admin activity
    await pool.query(
      'INSERT INTO admin_activity_log (admin_id, action, target_table, target_id, details) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, `${status.toUpperCase()}_EXPENSE`, 'expenses', id, JSON.stringify({ comments })]
    );
    
    res.json({ expense: result.rows[0] });
  } catch (error) {
    console.error('Error approving expense:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;