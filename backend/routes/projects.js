
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all projects with enhanced filtering
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = '', team_id = '', year = '' } = req.query;
        const offset = (page - 1) * limit;

        // Replace the entire query construction (lines 13-47) with:
        let query = `
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
        `;
        const params = [];
        let paramCount = 0;

        if (search) {
            paramCount++;
            const searchParam1 = paramCount;
            paramCount++;
            const searchParam2 = paramCount;
            query += ` AND (p.name ILIKE $${searchParam1} OR p.description ILIKE $${searchParam2})`;
            params.push(`%${search}%`, `%${search}%`);
        }

        if (status && status !== 'all') {
            paramCount++;
            query += ` AND p.status = $${paramCount}`;
            params.push(status);
        }

        if (team_id && team_id !== 'all') {
            paramCount++;
            query += ` AND p.business_unit_id = $${paramCount}`;
            params.push(team_id);
        }

        if (year && year !== 'all') {
            paramCount++;
            query += ` AND EXTRACT(YEAR FROM p.start_date) = $${paramCount}`;
            params.push(year);
        }

        // Role-based filtering
        if (req.user.role !== 'admin') {
            paramCount++;
            const userParam1 = paramCount;
            paramCount++;
            const userParam2 = paramCount;
            query += ` AND (p.project_manager_id = $${userParam1} OR EXISTS (
                SELECT 1 FROM project_teams pt2 WHERE pt2.project_id = p.id AND pt2.user_id = $${userParam2}
            ))`;
            params.push(req.user.id, req.user.id);
        }

        // Add ORDER BY and pagination
        paramCount++;
        const limitParam = paramCount;
        paramCount++;
        const offsetParam = paramCount;
        query += ` ORDER BY p.created_at DESC LIMIT $${limitParam} OFFSET $${offsetParam}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        
        // Build count query separately
        let countQuery = `
            SELECT COUNT(DISTINCT p.id)
            FROM projects p
            LEFT JOIN users u ON p.project_manager_id = u.id
            LEFT JOIN business_units bu ON p.business_unit_id = bu.id
            LEFT JOIN (
                SELECT project_id, COUNT(user_id) as team_size
                FROM project_teams
                GROUP BY project_id
            ) team_counts ON p.id = team_counts.project_id
            WHERE 1=1
        `;
        
        const countParams = [];
        let countParamCount = 0;

        if (search) {
            countParamCount++;
            const searchParam1 = countParamCount;
            countParamCount++;
            const searchParam2 = countParamCount;
            countQuery += ` AND (p.name ILIKE $${searchParam1} OR p.description ILIKE $${searchParam2})`;
            countParams.push(`%${search}%`, `%${search}%`);
        }

        if (status && status !== 'all') {
            countParamCount++;
            countQuery += ` AND p.status = $${countParamCount}`;
            countParams.push(status);
        }

        if (team_id && team_id !== 'all') {
            countParamCount++;
            countQuery += ` AND p.business_unit_id = $${countParamCount}`;
            countParams.push(team_id);
        }

        if (year && year !== 'all') {
            countParamCount++;
            countQuery += ` AND EXTRACT(YEAR FROM p.start_date) = $${countParamCount}`;
            countParams.push(year);
        }

        // Role-based filtering for count query
        if (req.user.role !== 'admin') {
            countParamCount++;
            const userParam1 = countParamCount;
            countParamCount++;
            const userParam2 = countParamCount;
            countQuery += ` AND (p.project_manager_id = $${userParam1} OR EXISTS (
                SELECT 1 FROM project_teams pt2 WHERE pt2.project_id = p.id AND pt2.user_id = $${userParam2}
            ))`;
            countParams.push(req.user.id, req.user.id);
        }
        
        const countResult = await pool.query(countQuery, countParams);

        res.json({
            projects: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Failed to get projects' });
    }
});

// Get project by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const projectQuery = `
            SELECT p.*, u.full_name as manager_name, bu.name as business_unit_name
            FROM projects p
            LEFT JOIN users u ON p.project_manager_id = u.id
            LEFT JOIN business_units bu ON p.business_unit_id = bu.id
            WHERE p.id = $1
        `;
        
        const projectResult = await pool.query(projectQuery, [id]);
        
        if (projectResult.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Get project team members
        const teamQuery = `
            SELECT pt.*, u.full_name, u.email, u.department
            FROM project_teams pt
            JOIN users u ON pt.user_id = u.id
            WHERE pt.project_id = $1
        `;
        const teamResult = await pool.query(teamQuery, [id]);

        // Get project milestones
        const milestonesQuery = `
            SELECT * FROM project_milestones
            WHERE project_id = $1
            ORDER BY due_date ASC
        `;
        const milestonesResult = await pool.query(milestonesQuery, [id]);

        // Get budget categories
        const categoriesQuery = `
            SELECT * FROM budget_categories
            WHERE project_id = $1
            ORDER BY name ASC
        `;
        const categoriesResult = await pool.query(categoriesQuery, [id]);

        const project = {
            ...projectResult.rows[0],
            team_members: teamResult.rows,
            milestones: milestonesResult.rows,
            budget_categories: categoriesResult.rows
        };

        res.json({ project });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Failed to get project' });
    }
});

// Create project
router.post('/', authenticateToken, [
    body('name').notEmpty().trim(),
    body('description').optional().trim(),
    body('total_budget').isNumeric(),
    body('currency').optional().isIn(['USD', 'ETB']),
    body('start_date').isISO8601(),
    body('end_date').isISO8601()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            name,
            description,
            total_budget,
            currency = 'USD',
            start_date,
            end_date,
            department,
            business_unit_id
        } = req.body;

        const result = await pool.query(
            `INSERT INTO projects (name, description, total_budget, currency, start_date, end_date, 
             department, project_manager_id, business_unit_id, allocated_budget)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $3) RETURNING *`,
            [name, description, total_budget, currency, start_date, end_date, department, req.user.id, business_unit_id]
        );

        res.status(201).json({ project: result.rows[0] });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Update project
router.put('/:id', authenticateToken, [
    body('name').optional().notEmpty().trim(),
    body('description').optional().trim(),
    body('total_budget').optional().isNumeric(),
    body('currency').optional().isIn(['USD', 'ETB']),
    body('start_date').optional().isISO8601(),
    body('end_date').optional().isISO8601()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const updates = req.body;
        
        // Check if user has permission to update this project
        if (req.user.role !== 'admin') {
            const projectCheck = await pool.query(
                'SELECT project_manager_id FROM projects WHERE id = $1',
                [id]
            );
            
            if (projectCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Project not found' });
            }
            
            if (projectCheck.rows[0].project_manager_id !== req.user.id) {
                return res.status(403).json({ error: 'Not authorized to update this project' });
            }
        }

        const setClause = Object.keys(updates)
            .map((key, index) => `${key} = $${index + 2}`)
            .join(', ');
        
        const values = [id, ...Object.values(updates)];
        
        const query = `UPDATE projects SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`;
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({ project: result.rows[0] });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// Delete project
router.delete('/:id', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// Get dashboard metrics
router.get('/dashboard/metrics', authenticateToken, async (req, res) => {
    try {
        let userFilter = '';
        const params = [];
        
        if (req.user.role !== 'admin') {
            userFilter = `WHERE p.project_manager_id = $1 OR EXISTS (
                SELECT 1 FROM project_teams pt WHERE pt.project_id = p.id AND pt.user_id = $1
            )`;
            params.push(req.user.id);
        }

        const metricsQuery = `
            SELECT 
                COUNT(*) as total_projects,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_projects,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
                COUNT(CASE WHEN status = 'on_hold' THEN 1 END) as on_hold_projects,
                COUNT(CASE WHEN end_date < CURRENT_DATE AND status != 'completed' THEN 1 END) as delayed_projects,
                COALESCE(SUM(total_budget), 0) as total_budget,
                COALESCE(SUM(spent_budget), 0) as total_spent,
                COALESCE(SUM(allocated_budget), 0) as total_allocated
            FROM projects p
            ${userFilter}
        `;
        
        const result = await pool.query(metricsQuery, params);
        const metrics = result.rows[0];
        
        // Calculate budget utilization
        const budgetUtilization = metrics.total_allocated > 0 
            ? (metrics.total_spent / metrics.total_allocated * 100).toFixed(1)
            : 0;

        res.json({
            ...metrics,
            budget_utilization: parseFloat(budgetUtilization)
        });
    } catch (error) {
        console.error('Get metrics error:', error);
        res.status(500).json({ error: 'Failed to get metrics' });
    }
});

module.exports = router;
