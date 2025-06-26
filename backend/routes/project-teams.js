const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { hasProjectPermission, isProjectCreator } = require('../utils/permissionHelper');
const { notifyProjectAdminAssignment, notifyExpenseStatusChange } = require('../utils/notificationHelper');

const router = express.Router();

// Get project teams
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { project_id, user_id } = req.query;
        
        let query, params;
        
        if (project_id) {
            // Get teams for a specific project
            query = `
                SELECT pt.id, pt.project_id, pt.user_id, pt.role, pt.created_at,
                       u.email, p.full_name, p.department
                FROM project_teams pt
                JOIN users u ON pt.user_id = u.id
                LEFT JOIN profiles p ON u.id = p.id
                WHERE pt.project_id = $1
                ORDER BY pt.created_at DESC
            `;
            params = [project_id];
        } else if (user_id) {
            // Get teams for a specific user
            query = `
                SELECT pt.id, pt.project_id, pt.user_id, pt.role, pt.created_at,
                       u.email, p.full_name, p.department
                FROM project_teams pt
                JOIN users u ON pt.user_id = u.id
                LEFT JOIN profiles p ON u.id = p.id
                WHERE pt.user_id = $1
                ORDER BY pt.created_at DESC
            `;
            params = [user_id];
        } else {
            return res.status(400).json({ error: 'Either project_id or user_id is required' });
        }
        
        const result = await pool.query(query, params);
        
        res.json({
            project_teams: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('Get project teams error:', error);
        res.status(500).json({ error: 'Failed to get project teams' });
    }
});

// Add user to project team
router.post('/', [
    authenticateToken,
    body('project_id').isUUID().withMessage('Valid project ID is required'),
    body('user_id').isUUID().withMessage('Valid user ID is required'),
    body('role').optional().isIn(['member', 'lead', 'manager']).withMessage('Role must be member, lead, or manager')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { project_id, user_id, role = 'member' } = req.body;

        // Check if user is already in the project team
        const existingMember = await pool.query(
            'SELECT id FROM project_teams WHERE project_id = $1 AND user_id = $2',
            [project_id, user_id]
        );

        if (existingMember.rows.length > 0) {
            return res.status(400).json({ error: 'User is already a member of this project team' });
        }

        // Add user to project team
        const result = await pool.query(
            'INSERT INTO project_teams (project_id, user_id, role) VALUES ($1, $2, $3) RETURNING *',
            [project_id, user_id, role]
        );

        // Send notification if user is assigned as admin/manager
        if (role === 'admin' || role === 'manager') {
            try {
                await notifyProjectAdminAssignment(user_id, project_id, req.user.id);
            } catch (notificationError) {
                console.error('Failed to send project admin assignment notification:', notificationError);
                // Don't fail the assignment if notification fails
            }
        }

        res.status(201).json({
            message: 'User added to project team successfully',
            project_team: result.rows[0]
        });
    } catch (error) {
        console.error('Add project team member error:', error);
        res.status(500).json({ error: 'Failed to add user to project team' });
    }
});

// Remove user from project team
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM project_teams WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project team member not found' });
        }

        res.json({
            message: 'User removed from project team successfully',
            project_team: result.rows[0]
        });
    } catch (error) {
        console.error('Remove project team member error:', error);
        res.status(500).json({ error: 'Failed to remove user from project team' });
    }
});

// Get all users available for project teams
router.get('/available-users', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.email, p.full_name, p.department, p.role
            FROM users u
            LEFT JOIN profiles p ON u.id = p.id
            ORDER BY p.full_name, u.email
        `;
        
        const result = await pool.query(query);
        
        res.json({
            users: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('Get available users error:', error);
        res.status(500).json({ error: 'Failed to get available users' });
    }
});

// Get projects for a specific user
router.get('/user-projects/:user_id', authenticateToken, async (req, res) => {
    try {
        const { user_id } = req.params;
        
        // Check if user is requesting their own projects or has admin privileges
        if (req.user.id !== user_id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const query = `
            SELECT p.id, p.name, p.description, p.total_budget, p.spent_budget, 
                   p.start_date, p.end_date, p.status, p.currency, p.created_at,
                   pt.role as team_role, pt.created_at as joined_at,
                   bu.name as business_unit_name
            FROM project_teams pt
            JOIN projects p ON pt.project_id = p.id
            LEFT JOIN business_units bu ON p.business_unit_id = bu.id
            WHERE pt.user_id = $1
            ORDER BY p.created_at DESC
        `;
        
        const result = await pool.query(query, [user_id]);
        
        res.json({
            projects: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('Get user projects error:', error);
        res.status(500).json({ error: 'Failed to get user projects' });
    }
});

// Approve/reject expense by project admin
router.put('/expenses/:id/approve', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, comments } = req.body; // status: 'approved' or 'rejected'
        
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        // First, get the expense
        const expenseQuery = 'SELECT * FROM expenses WHERE id = $1';
        const expenseResult = await pool.query(expenseQuery, [id]);
        
        if (expenseResult.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        
        const expense = expenseResult.rows[0];
        
        // Check if user is the project creator (only project creators can approve expenses)
        const isCreator = await isProjectCreator(req.user.id, expense.project_id);
        
        if (!isCreator && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only the project creator can approve expenses for this project' });
        }
        
        // Update the expense status
        const updateResult = await pool.query(
            'UPDATE expenses SET status = $1, approved_by = $2 WHERE id = $3 RETURNING *',
            [status, req.user.id, id]
        );
        
        if (updateResult.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        
        // Create notification for submitter
        const updatedExpense = updateResult.rows[0];
        try {
            await notifyExpenseStatusChange(id, status, req.user.id, comments);
        } catch (notificationError) {
            console.error('Failed to send expense status notification:', notificationError);
            // Don't fail the approval if notification fails
        }
        
        res.json({
            message: `Expense ${status} successfully`,
            expense: updateResult.rows[0]
        });
    } catch (error) {
        console.error('Project admin expense approval error:', error);
        res.status(500).json({ error: 'Failed to update expense status' });
    }
});

module.exports = router;