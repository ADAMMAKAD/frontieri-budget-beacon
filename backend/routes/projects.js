
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all projects
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT p.*, u.full_name as manager_name, bu.name as business_unit_name
            FROM projects p
            LEFT JOIN users u ON p.project_manager_id = u.id
            LEFT JOIN business_units bu ON p.business_unit_id = bu.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;

        if (search) {
            paramCount++;
            query += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        if (status) {
            paramCount++;
            query += ` AND p.status = $${paramCount}`;
            params.push(status);
        }

        // Role-based filtering
        if (req.user.role !== 'admin') {
            paramCount++;
            query += ` AND (p.project_manager_id = $${paramCount} OR EXISTS (
                SELECT 1 FROM project_teams pt WHERE pt.project_id = p.id AND pt.user_id = $${paramCount}
            ))`;
            params.push(req.user.id);
        }

        query += ` ORDER BY p.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        
        // Get total count
        const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) FROM').replace(/ORDER BY.*$/, '');
        const countResult = await pool.query(countQuery, params.slice(0, -2));

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

// Create project
router.post('/', authenticateToken, requireRole(['admin', 'project_manager']), [
    body('name').notEmpty().trim(),
    body('description').optional().trim(),
    body('total_budget').isNumeric(),
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
            start_date,
            end_date,
            department,
            business_unit_id
        } = req.body;

        const result = await pool.query(
            `INSERT INTO projects (name, description, total_budget, start_date, end_date, 
             department, project_manager_id, business_unit_id, allocated_budget)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $3) RETURNING *`,
            [name, description, total_budget, start_date, end_date, department, req.user.id, business_unit_id]
        );

        res.status(201).json({ project: result.rows[0] });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Update project
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            status,
            total_budget,
            start_date,
            end_date,
            department,
            business_unit_id
        } = req.body;

        // Check if user can update this project
        const projectCheck = await pool.query(
            'SELECT project_manager_id FROM projects WHERE id = $1',
            [id]
        );

        if (projectCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (req.user.role !== 'admin' && projectCheck.rows[0].project_manager_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to update this project' });
        }

        const result = await pool.query(
            `UPDATE projects SET 
             name = $1, description = $2, status = $3, total_budget = $4,
             start_date = $5, end_date = $6, department = $7, business_unit_id = $8,
             updated_at = NOW()
             WHERE id = $9 RETURNING *`,
            [name, description, status, total_budget, start_date, end_date, department, business_unit_id, id]
        );

        res.json({ project: result.rows[0] });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// Delete project
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
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

module.exports = router;
