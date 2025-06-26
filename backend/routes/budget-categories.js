const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { notifyBudgetChange } = require('../utils/notificationHelper');

// Get all budget categories
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 50, project_id } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT bc.*, 
                   COUNT(e.id) as expense_count,
                   COALESCE(SUM(e.amount), 0) as total_spent
            FROM budget_categories bc
            LEFT JOIN expenses e ON bc.id = e.category_id
        `;
        
        const params = [];
        let paramCount = 0;
        
        if (project_id) {
            paramCount++;
            query += ` WHERE bc.project_id = $${paramCount}`;
            params.push(project_id);
        }
        
        paramCount++;
        const limitParam = paramCount;
        paramCount++;
        const offsetParam = paramCount;
        
        query += ` GROUP BY bc.id ORDER BY bc.name LIMIT $${limitParam} OFFSET $${offsetParam}`;
        params.push(limit, offset);
        
        const result = await pool.query(query, params);
        
        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM budget_categories';
        const countParams = [];
        if (project_id) {
            countQuery += ' WHERE project_id = $1';
            countParams.push(project_id);
        }
        const countResult = await pool.query(countQuery, countParams);

        res.json({
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('Get budget categories error:', error);
        res.status(500).json({ error: 'Failed to get budget categories' });
    }
});

// Get budget category by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT bc.*, 
                   COUNT(e.id) as expense_count,
                   COALESCE(SUM(e.amount), 0) as total_spent
            FROM budget_categories bc
            LEFT JOIN expenses e ON bc.id = e.category_id
            WHERE bc.id = $1
            GROUP BY bc.id
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Budget category not found' });
        }

        res.json({ category: result.rows[0] });
    } catch (error) {
        console.error('Get budget category error:', error);
        res.status(500).json({ error: 'Failed to get budget category' });
    }
});

// Create budget category
router.post('/', authenticateToken, [
    body('name').notEmpty().trim().isLength({ min: 1, max: 100 }),
    body('project_id').notEmpty().isUUID(),
    body('allocated_amount').isNumeric({ min: 0 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, project_id, allocated_amount } = req.body;
        
        // Check if category name already exists for this project
        const existingCategory = await pool.query(
            'SELECT id FROM budget_categories WHERE LOWER(name) = LOWER($1) AND project_id = $2',
            [name, project_id]
        );
        
        if (existingCategory.rows.length > 0) {
            return res.status(400).json({ error: 'Budget category with this name already exists for this project' });
        }
        
        const result = await pool.query(
            `INSERT INTO budget_categories (name, project_id, allocated_amount)
             VALUES ($1, $2, $3) RETURNING *`,
            [name, project_id, allocated_amount]
        );

        // Send notification about new budget category
        try {
            await notifyBudgetChange(project_id, `New budget category "${name}" created`, 'created');
        } catch (notificationError) {
            console.error('Failed to send budget change notification:', notificationError);
            // Don't fail the creation if notification fails
        }

        res.status(201).json({ category: result.rows[0] });
    } catch (error) {
        console.error('Create budget category error:', error);
        res.status(500).json({ error: 'Failed to create budget category' });
    }
});

// Update budget category
router.put('/:id', authenticateToken, [
    body('name').optional().notEmpty().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('budget_limit').optional().isNumeric({ min: 0 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { name, description, budget_limit } = req.body;
        
        // Check if category exists
        const existingCategory = await pool.query(
            'SELECT * FROM budget_categories WHERE id = $1',
            [id]
        );
        
        if (existingCategory.rows.length === 0) {
            return res.status(404).json({ error: 'Budget category not found' });
        }
        
        // Check if new name conflicts with existing categories (excluding current one)
        if (name) {
            const nameConflict = await pool.query(
                'SELECT id FROM budget_categories WHERE LOWER(name) = LOWER($1) AND id != $2',
                [name, id]
            );
            
            if (nameConflict.rows.length > 0) {
                return res.status(400).json({ error: 'Budget category with this name already exists' });
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
        
        if (budget_limit !== undefined) {
            updates.push(`budget_limit = $${paramCount}`);
            values.push(budget_limit);
            paramCount++;
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }
        
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        
        const query = `
            UPDATE budget_categories 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;
        
        const result = await pool.query(query, values);

        // Send notification about budget category update
        try {
            const oldCategory = existingCategory.rows[0];
            const newCategory = result.rows[0];
            let changeMessage = `Budget category "${newCategory.name}" updated`;
            
            if (budget_limit !== undefined && oldCategory.budget_limit !== newCategory.budget_limit) {
                changeMessage += ` - Budget limit changed from ${oldCategory.budget_limit || 'N/A'} to ${newCategory.budget_limit || 'N/A'}`;
            }
            
            await notifyBudgetChange(newCategory.project_id, changeMessage, 'updated');
        } catch (notificationError) {
            console.error('Failed to send budget change notification:', notificationError);
            // Don't fail the update if notification fails
        }

        res.json({ category: result.rows[0] });
    } catch (error) {
        console.error('Update budget category error:', error);
        res.status(500).json({ error: 'Failed to update budget category' });
    }
});

// Delete budget category
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if category exists
        const existingCategory = await pool.query(
            'SELECT * FROM budget_categories WHERE id = $1',
            [id]
        );
        
        if (existingCategory.rows.length === 0) {
            return res.status(404).json({ error: 'Budget category not found' });
        }
        
        // Check if category is being used by any expenses
        const expenseCount = await pool.query(
            'SELECT COUNT(*) FROM expenses WHERE category_id = $1',
            [id]
        );
        
        if (parseInt(expenseCount.rows[0].count) > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete budget category that has associated expenses' 
            });
        }
        
        await pool.query('DELETE FROM budget_categories WHERE id = $1', [id]);

        res.json({ message: 'Budget category deleted successfully' });
    } catch (error) {
        console.error('Delete budget category error:', error);
        res.status(500).json({ error: 'Failed to delete budget category' });
    }
});

// Get budget category statistics
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
                bc.name,
                bc.budget_limit,
                COUNT(e.id) as total_expenses,
                COALESCE(SUM(e.amount), 0) as total_spent,
                COALESCE(SUM(CASE WHEN e.status = 'approved' THEN e.amount ELSE 0 END), 0) as approved_spent,
                COALESCE(SUM(CASE WHEN e.status = 'pending' THEN e.amount ELSE 0 END), 0) as pending_amount,
                CASE 
                    WHEN bc.budget_limit > 0 THEN 
                        ROUND((COALESCE(SUM(CASE WHEN e.status = 'approved' THEN e.amount ELSE 0 END), 0) / bc.budget_limit) * 100, 2)
                    ELSE 0
                END as utilization_percentage
            FROM budget_categories bc
            LEFT JOIN expenses e ON bc.id = e.category_id ${dateFilter}
            WHERE bc.id = $1
            GROUP BY bc.id, bc.name, bc.budget_limit
        `;
        
        const result = await pool.query(query, queryParams);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Budget category not found' });
        }

        res.json({ stats: result.rows[0] });
    } catch (error) {
        console.error('Get budget category stats error:', error);
        res.status(500).json({ error: 'Failed to get budget category statistics' });
    }
});

module.exports = router;