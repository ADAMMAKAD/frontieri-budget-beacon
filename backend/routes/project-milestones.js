const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all milestones (with role-based filtering)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, project_id } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT pm.*, p.name as project_name, u.full_name as created_by_name
            FROM project_milestones pm
            LEFT JOIN projects p ON pm.project_id = p.id
            LEFT JOIN users u ON pm.created_by = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;
        
        // Role-based filtering
        if (req.user.role !== 'admin') {
            paramCount++;
            query += ` AND (p.project_manager_id = $${paramCount} OR EXISTS (
                SELECT 1 FROM project_teams pt WHERE pt.project_id = pm.project_id AND pt.user_id = $${paramCount}
            ))`;
            params.push(req.user.id);
        }
        
        // Filter by project if specified
        if (project_id) {
            paramCount++;
            query += ` AND pm.project_id = $${paramCount}`;
            params.push(project_id);
        }
        
        // Filter by status if specified
        if (status && status !== 'all') {
            paramCount++;
            query += ` AND pm.status = $${paramCount}`;
            params.push(status);
        }
        
        query += ` ORDER BY pm.due_date ASC, pm.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);
        
        const result = await pool.query(query, params);
        
        // Get total count
        let countQuery = `
            SELECT COUNT(*) FROM project_milestones pm
            LEFT JOIN projects p ON pm.project_id = p.id
            WHERE 1=1
        `;
        const countParams = [];
        let countParamCount = 0;
        
        if (req.user.role !== 'admin') {
            countParamCount++;
            countQuery += ` AND (p.project_manager_id = $${countParamCount} OR EXISTS (
                SELECT 1 FROM project_teams pt WHERE pt.project_id = pm.project_id AND pt.user_id = $${countParamCount}
            ))`;
            countParams.push(req.user.id);
        }
        
        if (project_id) {
            countParamCount++;
            countQuery += ` AND pm.project_id = $${countParamCount}`;
            countParams.push(project_id);
        }
        
        if (status && status !== 'all') {
            countParamCount++;
            countQuery += ` AND pm.status = $${countParamCount}`;
            countParams.push(status);
        }
        
        const countResult = await pool.query(countQuery, countParams);
        
        res.json({
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('Get milestones error:', error);
        res.status(500).json({ error: 'Failed to get milestones' });
    }
});

// Get milestones for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { page = 1, limit = 20, status } = req.query;
        const offset = (page - 1) * limit;
        
        // Check if user has access to the project
        const projectAccess = await pool.query(
            `SELECT p.id FROM projects p
             LEFT JOIN project_teams pt ON p.id = pt.project_id
             WHERE p.id = $1 AND (
                 p.project_manager_id = $2 OR 
                 pt.user_id = $2 OR 
                 $3 = 'admin'
             )`,
            [projectId, req.user.id, req.user.role]
        );
        
        if (projectAccess.rows.length === 0 && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied to this project' });
        }
        
        let statusFilter = '';
        const queryParams = [projectId, limit, offset];
        
        if (status) {
            statusFilter = 'AND status = $4';
            queryParams.push(status);
        }
        
        const query = `
            SELECT pm.*, u.full_name as created_by_name
            FROM project_milestones pm
            LEFT JOIN users u ON pm.created_by = u.id
            WHERE pm.project_id = $1 ${statusFilter}
            ORDER BY pm.due_date ASC, pm.created_at DESC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await pool.query(query, queryParams);
        
        // Get total count
        const countQuery = `
            SELECT COUNT(*) FROM project_milestones 
            WHERE project_id = $1 ${status ? 'AND status = $2' : ''}
        `;
        const countParams = status ? [projectId, status] : [projectId];
        const countResult = await pool.query(countQuery, countParams);

        res.json({
            milestones: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('Get project milestones error:', error);
        res.status(500).json({ error: 'Failed to get project milestones' });
    }
});

// Get milestone by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT pm.*, u.full_name as created_by_name, p.name as project_name
            FROM project_milestones pm
            LEFT JOIN users u ON pm.created_by = u.id
            LEFT JOIN projects p ON pm.project_id = p.id
            WHERE pm.id = $1
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Milestone not found' });
        }
        
        const milestone = result.rows[0];
        
        // Check if user has access to the project
        const projectAccess = await pool.query(
            `SELECT p.id FROM projects p
             LEFT JOIN project_teams pt ON p.id = pt.project_id
             WHERE p.id = $1 AND (
                 p.project_manager_id = $2 OR 
                 pt.user_id = $2 OR 
                 $3 = 'admin'
             )`,
            [milestone.project_id, req.user.id, req.user.role]
        );
        
        if (projectAccess.rows.length === 0 && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied to this milestone' });
        }

        res.json({ milestone });
    } catch (error) {
        console.error('Get milestone error:', error);
        res.status(500).json({ error: 'Failed to get milestone' });
    }
});

// Create milestone
router.post('/', authenticateToken, [
    body('project_id').isUUID(),
    body('title').notEmpty().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('due_date').isISO8601(),
    body('status').optional().isIn(['not_started', 'in_progress', 'completed', 'overdue']),
    body('progress').optional().isInt({ min: 0, max: 100 }),
    body('created_by').optional().isUUID()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { project_id, title, description, due_date, status = 'not_started', progress = 0, created_by } = req.body;
        
        // Check if project exists and user has access
        const projectAccess = await pool.query(
            `SELECT p.id FROM projects p
             LEFT JOIN project_teams pt ON p.id = pt.project_id
             WHERE p.id = $1 AND (
                 p.project_manager_id = $2 OR 
                 pt.user_id = $2 OR
                 $3 = 'admin'
             )`,
            [project_id, req.user.id, req.user.role]
        );
        
        if (projectAccess.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied to create milestones for this project' });
        }
        
        const result = await pool.query(
            `INSERT INTO project_milestones (project_id, title, description, due_date, status, progress, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [project_id, title, description, due_date, status, progress, created_by || req.user.id]
        );

        res.status(201).json({ milestone: result.rows[0] });
    } catch (error) {
        console.error('Create milestone error:', error);
        res.status(500).json({ error: 'Failed to create milestone' });
    }
});

// Update milestone
router.put('/:id', authenticateToken, [
    body('title').optional().notEmpty().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('due_date').optional().isISO8601(),
    // assigned_to validation removed - column doesn't exist in schema
    body('status').optional().isIn(['not_started', 'in_progress', 'completed', 'overdue']),
    body('completion_date').optional().isISO8601()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { title, description, due_date, status, completion_date } = req.body;
        
        // Check if milestone exists and user has access
        const milestoneAccess = await pool.query(
            `SELECT pm.*, p.project_manager_id FROM project_milestones pm
             LEFT JOIN projects p ON pm.project_id = p.id
             LEFT JOIN project_teams pt ON p.id = pt.project_id
             WHERE pm.id = $1 AND (
                 p.project_manager_id = $2 OR 
                 pt.user_id = $2 OR 
                 pm.created_by = $2 OR
                 $3 = 'admin'
             )`,
            [id, req.user.id, req.user.role]
        );
        
        if (milestoneAccess.rows.length === 0) {
            return res.status(404).json({ error: 'Milestone not found or access denied' });
        }
        
        const milestone = milestoneAccess.rows[0];
        
        // Only project managers and admins can modify milestones
        if (req.user.role !== 'admin' && 
            milestone.project_manager_id !== req.user.id) {
            return res.status(403).json({ error: 'Only project managers and admins can modify milestones' });
        }
        
        // Build dynamic update query
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (title !== undefined) {
            updates.push(`title = $${paramCount}`);
            values.push(title);
            paramCount++;
        }
        
        if (description !== undefined) {
            updates.push(`description = $${paramCount}`);
            values.push(description);
            paramCount++;
        }
        
        if (due_date !== undefined) {
            updates.push(`due_date = $${paramCount}`);
            values.push(due_date);
            paramCount++;
        }
        
        // Note: assigned_to column removed as it doesn't exist in schema
        
        if (status !== undefined) {
            updates.push(`status = $${paramCount}`);
            values.push(status);
            paramCount++;
            
            // Auto-set completion date if status is completed
            if (status === 'completed' && !completion_date) {
                updates.push(`completion_date = CURRENT_TIMESTAMP`);
            }
        }
        
        if (completion_date !== undefined) {
            updates.push(`completion_date = $${paramCount}`);
            values.push(completion_date);
            paramCount++;
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }
        
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        
        const query = `
            UPDATE project_milestones 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;
        
        const result = await pool.query(query, values);

        res.json({ milestone: result.rows[0] });
    } catch (error) {
        console.error('Update milestone error:', error);
        res.status(500).json({ error: 'Failed to update milestone' });
    }
});

// Delete milestone
router.delete('/:id', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if milestone exists and user has access
        const milestoneAccess = await pool.query(
            `SELECT pm.*, p.manager_id FROM project_milestones pm
             LEFT JOIN projects p ON pm.project_id = p.id
             WHERE pm.id = $1 AND (
                 p.manager_id = $2 OR 
                 $3 = 'admin'
             )`,
            [id, req.user.id, req.user.role]
        );
        
        if (milestoneAccess.rows.length === 0) {
            return res.status(404).json({ error: 'Milestone not found or access denied' });
        }
        
        await pool.query('DELETE FROM project_milestones WHERE id = $1', [id]);

        res.json({ message: 'Milestone deleted successfully' });
    } catch (error) {
        console.error('Delete milestone error:', error);
        res.status(500).json({ error: 'Failed to delete milestone' });
    }
});

// Get milestone statistics for a project
router.get('/project/:projectId/stats', authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        
        // Check if user has access to the project
        const projectAccess = await pool.query(
            `SELECT p.id FROM projects p
             LEFT JOIN project_teams pt ON p.id = pt.project_id
             WHERE p.id = $1 AND (
                 p.project_manager_id = $2 OR 
                 pt.user_id = $2 OR 
                 $3 = 'admin'
             )`,
            [projectId, req.user.id, req.user.role]
        );
        
        if (projectAccess.rows.length === 0 && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied to this project' });
        }
        
        const query = `
            SELECT 
                COUNT(*) as total_milestones,
                COUNT(CASE WHEN status = 'not_started' THEN 1 END) as pending_milestones,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_milestones,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_milestones,
                COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_milestones,
                COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'completed' THEN 1 END) as past_due_milestones,
                ROUND(AVG(CASE WHEN completion_date IS NOT NULL AND due_date IS NOT NULL THEN 
                    EXTRACT(EPOCH FROM (completion_date - due_date))/86400 
                END), 2) as avg_completion_delay_days
            FROM project_milestones
            WHERE project_id = $1
        `;
        
        const result = await pool.query(query, [projectId]);

        res.json({ stats: result.rows[0] });
    } catch (error) {
        console.error('Get milestone stats error:', error);
        res.status(500).json({ error: 'Failed to get milestone statistics' });
    }
});

module.exports = router;