const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all business units
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const query = `
            SELECT bu.*, 
                   COUNT(DISTINCT p.id) as project_count,
                   COUNT(DISTINCT pr.id) as user_count,
                   COALESCE(SUM(p.total_budget), 0) as total_budget
            FROM business_units bu
            LEFT JOIN projects p ON bu.id = p.business_unit_id
            LEFT JOIN profiles pr ON bu.id = pr.team_id
            GROUP BY bu.id
            ORDER BY bu.name
            LIMIT $1 OFFSET $2
        `;
        
        const result = await pool.query(query, [limit, offset]);
        
        // Get total count
        const countResult = await pool.query('SELECT COUNT(*) FROM business_units');

        res.json({
            business_units: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('Get business units error:', error);
        res.status(500).json({ error: 'Failed to get business units' });
    }
});

// Get business unit by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT bu.*, 
                   COUNT(DISTINCT p.id) as project_count,
                   COUNT(DISTINCT u.id) as user_count,
                   COALESCE(SUM(p.total_budget), 0) as total_budget,
                   COALESCE(SUM(e.amount), 0) as total_expenses
            FROM business_units bu
            LEFT JOIN projects p ON bu.id = p.business_unit_id
            LEFT JOIN users u ON bu.id = u.team_id
            LEFT JOIN expenses e ON p.id = e.project_id
            WHERE bu.id = $1
            GROUP BY bu.id
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Business unit not found' });
        }

        res.json({ business_unit: result.rows[0] });
    } catch (error) {
        console.error('Get business unit error:', error);
        res.status(500).json({ error: 'Failed to get business unit' });
    }
});

// Create business unit
router.post('/', authenticateToken, requireRole(['admin', 'manager']), [
    body('name').notEmpty().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('manager_id').optional().isUUID()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, manager_id } = req.body;
        
        // Check if business unit name already exists
        const existingUnit = await pool.query(
            'SELECT id FROM business_units WHERE LOWER(name) = LOWER($1)',
            [name]
        );
        
        if (existingUnit.rows.length > 0) {
            return res.status(400).json({ error: 'Business unit with this name already exists' });
        }
        
        // Verify manager exists if provided
        if (manager_id) {
            const managerExists = await pool.query(
                'SELECT id FROM users WHERE id = $1',
                [manager_id]
            );
            
            if (managerExists.rows.length === 0) {
                return res.status(400).json({ error: 'Manager not found' });
            }
        }
        
        const result = await pool.query(
            `INSERT INTO business_units (name, description, manager_id)
             VALUES ($1, $2, $3) RETURNING *`,
            [name, description, manager_id]
        );

        res.status(201).json({ business_unit: result.rows[0] });
    } catch (error) {
        console.error('Create business unit error:', error);
        res.status(500).json({ error: 'Failed to create business unit' });
    }
});

// Update business unit
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), [
    body('name').optional().notEmpty().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('manager_id').optional().isUUID()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { name, description, manager_id } = req.body;
        
        // Check if business unit exists
        const existingUnit = await pool.query(
            'SELECT * FROM business_units WHERE id = $1',
            [id]
        );
        
        if (existingUnit.rows.length === 0) {
            return res.status(404).json({ error: 'Business unit not found' });
        }
        
        // Check if new name conflicts with existing units (excluding current one)
        if (name) {
            const nameConflict = await pool.query(
                'SELECT id FROM business_units WHERE LOWER(name) = LOWER($1) AND id != $2',
                [name, id]
            );
            
            if (nameConflict.rows.length > 0) {
                return res.status(400).json({ error: 'Business unit with this name already exists' });
            }
        }
        
        // Verify manager exists if provided
        if (manager_id) {
            const managerExists = await pool.query(
                'SELECT id FROM users WHERE id = $1',
                [manager_id]
            );
            
            if (managerExists.rows.length === 0) {
                return res.status(400).json({ error: 'Manager not found' });
            }
        }
        
        // Build dynamic update query
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (name !== undefined) {
            updates.push(`name = $${paramCount}`);
            values.push(name);
            paramCount++;
        }
        
        if (description !== undefined) {
            updates.push(`description = $${paramCount}`);
            values.push(description);
            paramCount++;
        }
        
        if (manager_id !== undefined) {
            updates.push(`manager_id = $${paramCount}`);
            values.push(manager_id);
            paramCount++;
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }
        
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        
        const query = `
            UPDATE business_units 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;
        
        const result = await pool.query(query, values);

        res.json({ business_unit: result.rows[0] });
    } catch (error) {
        console.error('Update business unit error:', error);
        res.status(500).json({ error: 'Failed to update business unit' });
    }
});

// Delete business unit
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if business unit exists
        const existingUnit = await pool.query(
            'SELECT * FROM business_units WHERE id = $1',
            [id]
        );
        
        if (existingUnit.rows.length === 0) {
            return res.status(404).json({ error: 'Business unit not found' });
        }
        
        // Check if business unit has associated projects
        const projectCount = await pool.query(
            'SELECT COUNT(*) FROM projects WHERE business_unit_id = $1',
            [id]
        );
        
        if (parseInt(projectCount.rows[0].count) > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete business unit that has associated projects' 
            });
        }
        
        // Check if business unit has associated users
        const userCount = await pool.query(
            'SELECT COUNT(*) FROM users WHERE business_unit_id = $1',
            [id]
        );
        
        if (parseInt(userCount.rows[0].count) > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete business unit that has associated users' 
            });
        }
        
        await pool.query('DELETE FROM business_units WHERE id = $1', [id]);

        res.json({ message: 'Business unit deleted successfully' });
    } catch (error) {
        console.error('Delete business unit error:', error);
        res.status(500).json({ error: 'Failed to delete business unit' });
    }
});

// Get business unit projects
router.get('/:id/projects', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;
        
        let statusFilter = '';
        const queryParams = [id, limit, offset];
        
        if (status) {
            statusFilter = 'AND p.status = $4';
            queryParams.push(status);
        }
        
        const query = `
            SELECT p.*, u.full_name as manager_name,
                   COUNT(e.id) as expense_count,
                   COALESCE(SUM(e.amount), 0) as total_expenses
            FROM projects p
            LEFT JOIN users u ON p.manager_id = u.id
            LEFT JOIN expenses e ON p.id = e.project_id
            WHERE p.business_unit_id = $1 ${statusFilter}
            GROUP BY p.id, u.full_name
            ORDER BY p.created_at DESC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await pool.query(query, queryParams);
        
        // Get total count
        const countQuery = `
            SELECT COUNT(*) FROM projects 
            WHERE business_unit_id = $1 ${status ? 'AND status = $2' : ''}
        `;
        const countParams = status ? [id, status] : [id];
        const countResult = await pool.query(countQuery, countParams);

        res.json({
            projects: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('Get business unit projects error:', error);
        res.status(500).json({ error: 'Failed to get business unit projects' });
    }
});

// Get business unit statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;
        
        let dateFilter = '';
        const queryParams = [id];
        
        if (startDate && endDate) {
            dateFilter = 'AND e.expense_date BETWEEN $2 AND $3';
            queryParams.push(startDate, endDate);
        }
        
        const query = `
            SELECT 
                bu.name,
                COUNT(DISTINCT p.id) as total_projects,
                COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_projects,
                COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) as completed_projects,
                COUNT(DISTINCT u.id) as total_users,
                COALESCE(SUM(p.total_budget), 0) as total_budget,
                COALESCE(SUM(CASE WHEN e.status = 'approved' THEN e.amount ELSE 0 END), 0) as total_spent,
                CASE 
                    WHEN SUM(p.total_budget) > 0 THEN 
                        ROUND((COALESCE(SUM(CASE WHEN e.status = 'approved' THEN e.amount ELSE 0 END), 0) / SUM(p.total_budget)) * 100, 2)
                    ELSE 0
                END as budget_utilization
            FROM business_units bu
            LEFT JOIN projects p ON bu.id = p.business_unit_id
            LEFT JOIN users u ON bu.id = u.team_id
            LEFT JOIN expenses e ON p.id = e.project_id ${dateFilter}
            WHERE bu.id = $1
            GROUP BY bu.id, bu.name
        `;
        
        const result = await pool.query(query, queryParams);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Business unit not found' });
        }

        res.json({ stats: result.rows[0] });
    } catch (error) {
        console.error('Get business unit stats error:', error);
        res.status(500).json({ error: 'Failed to get business unit statistics' });
    }
});

module.exports = router;