const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get all budget versions for a project
router.get('/project/:projectId', async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM public.budget_versions WHERE project_id = $1 ORDER BY version_number DESC', [projectId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get a specific budget version by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM public.budget_versions WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Budget version not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Create a new budget version
router.post('/', authenticateToken, async (req, res) => {
    const { project_id, title, description } = req.body;
    const created_by = req.user.id;

    if (!project_id || !title) {
        return res.status(400).json({ msg: 'Project ID and title are required' });
    }

    try {
        // Get the latest version number for the project
        const lastVersionRes = await pool.query('SELECT MAX(version_number) as max_version FROM public.budget_versions WHERE project_id = $1', [project_id]);
        const nextVersion = (lastVersionRes.rows[0].max_version || 0) + 1;

        const result = await pool.query(
            'INSERT INTO public.budget_versions (project_id, title, description, version_number, created_by, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [project_id, title, description, nextVersion, created_by, 'draft']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Update a budget version
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, description, status } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const versionCheck = await pool.query('SELECT * FROM public.budget_versions WHERE id = $1', [id]);
        if (versionCheck.rows.length === 0) {
            return res.status(404).json({ msg: 'Budget version not found' });
        }

        // Project managers can only update if they created it and it's still a draft
        if (userRole === 'project_manager' && (versionCheck.rows[0].created_by !== userId || versionCheck.rows[0].status !== 'draft')) {
            return res.status(403).json({ msg: 'Forbidden: Project managers can only update their own draft versions.' });
        }

        const fieldsToUpdate = {};
        if (title) fieldsToUpdate.title = title;
        if (description) fieldsToUpdate.description = description;
        if (status) fieldsToUpdate.status = status; // Admins can change status
        
        if (Object.keys(fieldsToUpdate).length === 0) {
            return res.status(400).json({ msg: 'No fields to update provided' });
        }

        let query = 'UPDATE public.budget_versions SET ';
        const values = [];
        let i = 1;
        for (const [key, value] of Object.entries(fieldsToUpdate)) {
            query += `${key} = $${i}, `;
            values.push(value);
            i++;
        }
        query += 'updated_at = NOW() WHERE id = $' + i + ' RETURNING *';
        values.push(id);

        const result = await pool.query(query, values);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Approve a budget version
router.patch('/:id/approve', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    const { id } = req.params;
    const approved_by = req.user.id;

    try {
        const versionCheck = await pool.query('SELECT * FROM public.budget_versions WHERE id = $1', [id]);
        if (versionCheck.rows.length === 0) {
            return res.status(404).json({ msg: 'Budget version not found' });
        }
        if (versionCheck.rows[0].status === 'approved') {
            return res.status(400).json({ msg: 'Budget version is already approved' });
        }

        const result = await pool.query(
            'UPDATE public.budget_versions SET status = $1, approved_by = $2, approved_at = NOW(), updated_at = NOW() WHERE id = $3 RETURNING *',
            ['approved', approved_by, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


// Delete a budget version (only if it's a draft and user is creator or admin)
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const versionResult = await pool.query('SELECT * FROM public.budget_versions WHERE id = $1', [id]);
        if (versionResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Budget version not found' });
        }

        const version = versionResult.rows[0];

        if (version.status !== 'draft' && userRole !== 'admin') {
            return res.status(403).json({ msg: 'Forbidden: Can only delete draft versions.' });
        }

        if (userRole === 'project_manager' && version.created_by !== userId) {
            return res.status(403).json({ msg: 'Forbidden: Project managers can only delete their own draft versions.' });
        }
        
        // Check if there are budget categories associated with this version
        const categoriesResult = await pool.query('SELECT COUNT(*) FROM public.budget_categories WHERE budget_version_id = $1', [id]);
        if (parseInt(categoriesResult.rows[0].count) > 0) {
             if (userRole !== 'admin') { // Non-admins cannot delete if categories exist
                return res.status(400).json({ msg: 'Cannot delete budget version with associated categories. Please remove categories first or contact an admin.' });
             }
             // Admins can proceed, but we might want to log this or handle cascade deletion if schema allows
             // For now, let's assume categories should be manually handled or schema has ON DELETE CASCADE for budget_categories.budget_version_id
        }

        await pool.query('DELETE FROM public.budget_versions WHERE id = $1', [id]);
        res.json({ msg: 'Budget version deleted' });
    } catch (err) {
        console.error(err.message);
        // Check for foreign key constraint violation if categories are not deleted
        if (err.code === '23503') { // PostgreSQL foreign key violation error code
             return res.status(400).json({ msg: 'Cannot delete budget version. It is referenced by other records (e.g., budget categories). Please remove them first.' });
        }
        res.status(500).send('Server error');
    }
});

module.exports = router;