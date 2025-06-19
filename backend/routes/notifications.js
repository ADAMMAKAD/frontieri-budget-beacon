const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get user notifications
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20, unread_only = false } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = 'WHERE user_id = $1';
        const queryParams = [req.user.id, limit, offset];
        
        if (unread_only === 'true') {
            whereClause += ' AND read = false';
        }
        
        const query = `
            SELECT * FROM notifications 
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await pool.query(query, queryParams);
        
        // Get total count
        const countQuery = `
            SELECT COUNT(*) FROM notifications 
            ${whereClause.replace('$2', '$1').replace('$3', '$1')}
        `;
        const countResult = await pool.query(countQuery, [req.user.id]);
        
        // Get unread count
        const unreadResult = await pool.query(
            'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false',
            [req.user.id]
        );

        res.json({
            notifications: result.rows,
            total: parseInt(countResult.rows[0].count),
            unread_count: parseInt(unreadResult.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `UPDATE notifications 
             SET read = true 
             WHERE id = $1 AND user_id = $2 AND read = false
             RETURNING *`,
            [id, req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found or already read' });
        }

        res.json({ notification: result.rows[0] });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE notifications 
             SET read = true 
             WHERE user_id = $1 AND read = false
             RETURNING *`,
            [req.user.id]
        );

        res.json({ 
            message: 'All notifications marked as read',
            updated_count: result.rowCount
        });
    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// Create notification (admin only)
router.post('/', authenticateToken, requireRole(['admin']), [
    body('user_id').isUUID(),
    body('title').notEmpty().trim().isLength({ min: 1, max: 200 }),
    body('message').notEmpty().trim().isLength({ min: 1, max: 1000 }),
    body('type').isIn(['info', 'warning', 'error', 'success'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { user_id, title, message, type } = req.body;
        
        // Verify user exists
        const userExists = await pool.query(
            'SELECT id FROM users WHERE id = $1',
            [user_id]
        );
        
        if (userExists.rows.length === 0) {
            return res.status(400).json({ error: 'User not found' });
        }
        
        const result = await pool.query(
            `INSERT INTO notifications (user_id, title, message, type)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [user_id, title, message, type]
        );

        res.status(201).json({ notification: result.rows[0] });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
});

// Broadcast notification to all users (admin only)
router.post('/broadcast', authenticateToken, requireRole(['admin']), [
    body('title').notEmpty().trim().isLength({ min: 1, max: 200 }),
    body('message').notEmpty().trim().isLength({ min: 1, max: 1000 }),
    body('type').isIn(['info', 'warning', 'error', 'success']),
    body('role_filter').optional().isArray()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, message, type, role_filter } = req.body;
        
        // Get users to notify
        let userQuery = 'SELECT id FROM users WHERE status = $1';
        const queryParams = ['active'];
        
        if (role_filter && role_filter.length > 0) {
            userQuery += ` AND role = ANY($2)`;
            queryParams.push(role_filter);
        }
        
        const usersResult = await pool.query(userQuery, queryParams);
        
        if (usersResult.rows.length === 0) {
            return res.status(400).json({ error: 'No users found to notify' });
        }
        
        // Create notifications for all users
        const notifications = [];
        for (const user of usersResult.rows) {
            const result = await pool.query(
                `INSERT INTO notifications (user_id, title, message, type)
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [user.id, title, message, type]
            );
            notifications.push(result.rows[0]);
        }

        res.status(201).json({ 
            message: `Broadcast notification sent to ${notifications.length} users`,
            notifications_created: notifications.length
        });
    } catch (error) {
        console.error('Broadcast notification error:', error);
        res.status(500).json({ error: 'Failed to broadcast notification' });
    }
});

// Get notification statistics (admin only)
router.get('/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let dateFilter = '';
        const queryParams = [];
        
        if (startDate && endDate) {
            dateFilter = 'WHERE created_at BETWEEN $1 AND $2';
            queryParams.push(startDate, endDate);
        }
        
        const query = `
            SELECT 
                COUNT(*) as total_notifications,
            COUNT(CASE WHEN read = false THEN 1 END) as unread_notifications,
            COUNT(CASE WHEN read = true THEN 1 END) as read_notifications,
            COUNT(CASE WHEN type = 'info' THEN 1 END) as info_notifications,
            COUNT(CASE WHEN type = 'warning' THEN 1 END) as warning_notifications,
            COUNT(CASE WHEN type = 'error' THEN 1 END) as error_notifications,
            COUNT(CASE WHEN type = 'success' THEN 1 END) as success_notifications,
            0 as avg_read_time_hours
            FROM notifications
            ${dateFilter}
        `;
        
        const result = await pool.query(query, queryParams);

        res.json({ stats: result.rows[0] });
    } catch (error) {
        console.error('Get notification stats error:', error);
        res.status(500).json({ error: 'Failed to get notification statistics' });
    }
});

module.exports = router;