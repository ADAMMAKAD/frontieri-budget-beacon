const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all expenses
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, status = '', project_id = '' } = req.query;
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

        if (project_id && project_id !== 'all') {
            paramCount++;
            query += ` AND e.project_id = $${paramCount}`;
            params.push(project_id);
        }

        // Role-based filtering
        if (req.user.role !== 'admin') {
            paramCount++;
            query += ` AND (e.submitted_by = $${paramCount} OR p.project_manager_id = $${paramCount} OR EXISTS (
                SELECT 1 FROM project_teams pt WHERE pt.project_id = e.project_id AND pt.user_id = $${paramCount}
            ))`;
            params.push(req.user.id);
        }

        query += ` ORDER BY e.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        
        // Get total count with a separate, simpler query
        let countQuery = `
            SELECT COUNT(*) as count
            FROM expenses e
            LEFT JOIN projects p ON e.project_id = p.id
            WHERE 1=1
        `;
        const countParams = [];
        let countParamCount = 0;

        if (status && status !== 'all') {
            countParamCount++;
            countQuery += ` AND e.status = $${countParamCount}`;
            countParams.push(status);
        }

        if (project_id && project_id !== 'all') {
            countParamCount++;
            countQuery += ` AND e.project_id = $${countParamCount}`;
            countParams.push(project_id);
        }

        // Role-based filtering for count
        if (req.user.role !== 'admin') {
            countParamCount++;
            countQuery += ` AND (e.submitted_by = $${countParamCount} OR p.project_manager_id = $${countParamCount} OR EXISTS (
                SELECT 1 FROM project_teams pt WHERE pt.project_id = e.project_id AND pt.user_id = $${countParamCount}
            ))`;
            countParams.push(req.user.id);
        }

        const countResult = await pool.query(countQuery, countParams);
        const totalCount = countResult.rows[0]?.count || 0;

        res.json({
            expenses: result.rows,
            total: parseInt(totalCount),
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ error: 'Failed to get expenses' });
    }
});

// Get project expenses
router.get('/project/:projectId', authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { page = 1, limit = 10, status = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT e.*, u1.full_name as submitted_by_name,
                   u2.full_name as approved_by_name,
                   bc.name as category_name
            FROM expenses e
            LEFT JOIN users u1 ON e.submitted_by = u1.id
            LEFT JOIN users u2 ON e.approved_by = u2.id
            LEFT JOIN budget_categories bc ON e.category_id = bc.id
            WHERE e.project_id = $1
        `;
        const params = [projectId];
        let paramCount = 1;

        if (status && status !== 'all') {
            paramCount++;
            query += ` AND e.status = $${paramCount}`;
            params.push(status);
        }

        query += ` ORDER BY e.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        
        // Get total count with a separate, simpler query
        let countQuery = `
            SELECT COUNT(*) as count
            FROM expenses e
            WHERE e.project_id = $1
        `;
        const countParams = [projectId];
        let countParamCount = 1;

        if (status && status !== 'all') {
            countParamCount++;
            countQuery += ` AND e.status = $${countParamCount}`;
            countParams.push(status);
        }

        const countResult = await pool.query(countQuery, countParams);
        const totalCount = countResult.rows[0]?.count || 0;

        res.json({
            expenses: result.rows,
            total: parseInt(totalCount),
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('Get project expenses error:', error);
        res.status(500).json({ error: 'Failed to get project expenses' });
    }
});

// Create expense
router.post('/', authenticateToken, [
    body('project_id').isUUID(),
    body('category_id').isUUID().notEmpty(),
    body('description').notEmpty().trim(),
    body('amount').isNumeric().isFloat({ min: 0.01 }),
    body('expense_date').optional().isDate(),
    body('submitted_by').optional().isUUID()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { project_id, category_id, description, amount, expense_date } = req.body;
        
        // Verify user has access to the project
        const projectCheck = await pool.query(
            `SELECT p.id FROM projects p 
             LEFT JOIN project_teams pt ON p.id = pt.project_id 
             WHERE p.id = $1 AND (p.project_manager_id = $2 OR pt.user_id = $2 OR $3 = 'admin')`,
            [project_id, req.user.id, req.user.role]
        );
        
        if (projectCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not authorized to add expenses to this project' });
        }
        
        // Verify category exists and belongs to the project
        if (category_id) {
            const categoryCheck = await pool.query(
                'SELECT id FROM budget_categories WHERE id = $1 AND project_id = $2',
                [category_id, project_id]
            );
            
            if (categoryCheck.rows.length === 0) {
                return res.status(400).json({ error: 'Invalid category for this project' });
            }
        }
        
        const result = await pool.query(
            `INSERT INTO expenses (project_id, category_id, description, amount, expense_date, submitted_by) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [project_id, category_id, description, amount, expense_date || new Date(), req.user.id]
        );

        res.status(201).json({ expense: result.rows[0] });
    } catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({ error: 'Failed to create expense' });
    }
});

// Update expense
router.put('/:id', authenticateToken, [
    body('description').optional().notEmpty().trim(),
    body('amount').optional().isNumeric().isFloat({ min: 0.01 }),
    body('expense_date').optional().isDate(),
    body('status').optional().isIn(['pending', 'approved', 'rejected', 'paid'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const updates = req.body;
        
        // Check if user can update this expense
        const expenseCheck = await pool.query(
            'SELECT submitted_by, status FROM expenses WHERE id = $1',
            [id]
        );
        
        if (expenseCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        
        const expense = expenseCheck.rows[0];
        
        // Only submitter can update pending expenses, or admin/manager can update status
        if (expense.submitted_by !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized to update this expense' });
        }
        
        // Don't allow submitter to change status
        if (expense.submitted_by === req.user.id && updates.status && expense.status !== 'pending') {
            return res.status(400).json({ error: 'Cannot modify approved/rejected expenses' });
        }
        
        const setClause = Object.keys(updates)
            .map((key, index) => `${key} = $${index + 2}`)
            .join(', ');
        
        const values = [id, ...Object.values(updates)];
        
        const query = `UPDATE expenses SET ${setClause} WHERE id = $1 RETURNING *`;
        const result = await pool.query(query, values);

        res.json({ expense: result.rows[0] });
    } catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({ error: 'Failed to update expense' });
    }
});

// Delete expense
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if user can delete this expense
        const expenseCheck = await pool.query(
            'SELECT submitted_by, status FROM expenses WHERE id = $1',
            [id]
        );
        
        if (expenseCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        
        const expense = expenseCheck.rows[0];
        
        // Only submitter can delete pending expenses, or admin can delete any
        if (expense.submitted_by !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to delete this expense' });
        }
        
        if (expense.status !== 'pending' && req.user.role !== 'admin') {
            return res.status(400).json({ error: 'Cannot delete approved/rejected expenses' });
        }
        
        await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
        
        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({ error: 'Failed to delete expense' });
    }
});



module.exports = router;