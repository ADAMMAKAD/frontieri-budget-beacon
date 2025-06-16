
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all team members
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', project_id = '', role = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT pt.*, u.full_name as user_name, u.email as user_email, u.department as user_department,
                   p.name as project_name
            FROM project_teams pt
            LEFT JOIN users u ON pt.user_id = u.id
            LEFT JOIN projects p ON pt.project_id = p.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;

        if (search) {
            paramCount++;
            query += ` AND (u.full_name ILIKE $${paramCount} OR p.name ILIKE $${paramCount} OR pt.role ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        if (project_id) {
            paramCount++;
            query += ` AND pt.project_id = $${paramCount}`;
            params.push(project_id);
        }

        if (role) {
            paramCount++;
            query += ` AND pt.role = $${paramCount}`;
            params.push(role);
        }

        // Role-based filtering
        if (req.user.role !== 'admin') {
            paramCount++;
            query += ` AND (p.project_manager_id = $${paramCount} OR pt.user_id = $${paramCount})`;
            params.push(req.user.id);
        }

        query += ` ORDER BY pt.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        
        // Get total count
        const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) FROM').replace(/ORDER BY.*$/, '');
        const countResult = await pool.query(countQuery, params.slice(0, -2));

        res.json({
            teams: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('Get teams error:', error);
        res.status(500).json({ error: 'Failed to get teams' });
    }
});

// Add team member
router.post('/', authenticateToken, requireRole(['admin', 'project_manager']), [
    body('project_id').isUUID(),
    body('user_id').isUUID(),
    body('role').isIn(['manager', 'member', 'viewer'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { project_id, user_id, role } = req.body;

        // Check if user is already on the project
        const existingMember = await pool.query(
            'SELECT id FROM project_teams WHERE project_id = $1 AND user_id = $2',
            [project_id, user_id]
        );

        if (existingMember.rows.length > 0) {
            return res.status(400).json({ error: 'User is already on this project' });
        }

        const result = await pool.query(
            'INSERT INTO project_teams (project_id, user_id, role) VALUES ($1, $2, $3) RETURNING *',
            [project_id, user_id, role]
        );

        res.status(201).json({ team: result.rows[0] });
    } catch (error) {
        console.error('Add team member error:', error);
        res.status(500).json({ error: 'Failed to add team member' });
    }
});

// Remove team member
router.delete('/:id', authenticateToken, requireRole(['admin', 'project_manager']), async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM project_teams WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Team member not found' });
        }

        res.json({ message: 'Team member removed successfully' });
    } catch (error) {
        console.error('Remove team member error:', error);
        res.status(500).json({ error: 'Failed to remove team member' });
    }
});

module.exports = router;
