const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { 
    hasProjectPermission, 
    isProjectAdmin, 
    getUserProjectPermissions,
    getUserAdminProjects,
    requireProjectPermission,
    requireProjectAdmin
} = require('../utils/permissionHelper');
const { notifyProjectAdminAssignment } = require('../utils/notificationHelper');

const router = express.Router();

// Get all project admins for a specific project
router.get('/:projectId/admins', authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        
        // Check if user has permission to view project team
        if (req.user.role !== 'admin' && !await hasProjectPermission(req.user.id, projectId, 'manage_team')) {
            return res.status(403).json({ error: 'Insufficient permissions to view project admins' });
        }
        
        const query = `
            SELECT 
                u.id,
                u.email,
                u.full_name,
                u.department,
                pt.role,
                pt.created_at as assigned_at
            FROM project_teams pt
            JOIN users u ON pt.user_id = u.id
            WHERE pt.project_id = $1 AND pt.role = 'admin'
            ORDER BY pt.created_at DESC
        `;
        
        const result = await pool.query(query, [projectId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching project admins:', error);
        res.status(500).json({ error: 'Failed to fetch project admins' });
    }
});

// Assign user as project admin
router.post('/:projectId/admins', 
    authenticateToken,
    requireProjectPermission('manage_team'),
    [
        body('userId').isUUID().withMessage('Valid user ID is required'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            
            const { projectId } = req.params;
            const { userId } = req.body;
            
            // Check if user exists
            const userCheck = await pool.query('SELECT id, full_name FROM users WHERE id = $1', [userId]);
            if (userCheck.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Check if project exists
            const projectCheck = await pool.query('SELECT id, name FROM projects WHERE id = $1', [projectId]);
            if (projectCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Project not found' });
            }
            
            // Check if user is already in the project team
            const existingMember = await pool.query(
                'SELECT role FROM project_teams WHERE project_id = $1 AND user_id = $2',
                [projectId, userId]
            );
            
            if (existingMember.rows.length > 0) {
                // Update existing role to admin
                await pool.query(
                    'UPDATE project_teams SET role = $1, updated_at = NOW() WHERE project_id = $2 AND user_id = $3',
                    ['admin', projectId, userId]
                );
            } else {
                // Add new team member as admin
                await pool.query(
                    'INSERT INTO project_teams (project_id, user_id, role) VALUES ($1, $2, $3)',
                    [projectId, userId, 'admin']
                );
            }
            
            // Send notification
            try {
                await notifyProjectAdminAssignment(projectId, userId, req.user.id);
            } catch (notificationError) {
                console.error('Failed to send admin assignment notification:', notificationError);
            }
            
            res.json({ 
                message: 'User assigned as project admin successfully',
                user: userCheck.rows[0],
                project: projectCheck.rows[0]
            });
        } catch (error) {
            console.error('Error assigning project admin:', error);
            res.status(500).json({ error: 'Failed to assign project admin' });
        }
    }
);

// Remove project admin role
router.delete('/:projectId/admins/:userId', 
    authenticateToken,
    requireProjectPermission('manage_team'),
    async (req, res) => {
        try {
            const { projectId, userId } = req.params;
            
            // Check if user is in the project team
            const memberCheck = await pool.query(
                'SELECT role FROM project_teams WHERE project_id = $1 AND user_id = $2',
                [projectId, userId]
            );
            
            if (memberCheck.rows.length === 0) {
                return res.status(404).json({ error: 'User is not a member of this project' });
            }
            
            if (memberCheck.rows[0].role !== 'admin') {
                return res.status(400).json({ error: 'User is not a project admin' });
            }
            
            // Change role to member instead of removing completely
            await pool.query(
                'UPDATE project_teams SET role = $1, updated_at = NOW() WHERE project_id = $2 AND user_id = $3',
                ['member', projectId, userId]
            );
            
            res.json({ message: 'Project admin role removed successfully' });
        } catch (error) {
            console.error('Error removing project admin:', error);
            res.status(500).json({ error: 'Failed to remove project admin' });
        }
    }
);

// Get user's project admin permissions
router.get('/permissions/:projectId', authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        
        const permissions = await getUserProjectPermissions(userId, projectId);
        const isAdmin = await isProjectAdmin(userId, projectId);
        
        res.json({
            isProjectAdmin: isAdmin,
            permissions: permissions,
            isSystemAdmin: req.user.role === 'admin'
        });
    } catch (error) {
        console.error('Error fetching user permissions:', error);
        res.status(500).json({ error: 'Failed to fetch permissions' });
    }
});

// Get all projects where user is admin
router.get('/my-admin-projects', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        
        let query;
        let queryParams;
        
        // Managers and admins can see all projects for administrative purposes
        if (userRole === 'admin' || userRole === 'manager') {
            query = `
                SELECT 
                    p.id,
                    p.name,
                    p.description,
                    p.status,
                    p.start_date,
                    p.end_date,
                    COALESCE(pt.created_at, p.created_at) as admin_since
                FROM projects p
                LEFT JOIN project_teams pt ON p.id = pt.project_id AND pt.user_id = $1 AND pt.role = 'admin'
                ORDER BY p.created_at DESC
            `;
            queryParams = [userId];
        } else {
            // Other users only see projects where they are explicitly assigned as admin
            query = `
                SELECT 
                    p.id,
                    p.name,
                    p.description,
                    p.status,
                    p.start_date,
                    p.end_date,
                    pt.created_at as admin_since
                FROM projects p
                JOIN project_teams pt ON p.id = pt.project_id
                WHERE pt.user_id = $1 AND pt.role = 'admin'
                ORDER BY pt.created_at DESC
            `;
            queryParams = [userId];
        }
        
        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching admin projects:', error);
        res.status(500).json({ error: 'Failed to fetch admin projects' });
    }
});

// Get available permissions list
router.get('/permissions-list', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const query = 'SELECT name, description FROM project_permissions ORDER BY name';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching permissions list:', error);
        res.status(500).json({ error: 'Failed to fetch permissions list' });
    }
});

module.exports = router;