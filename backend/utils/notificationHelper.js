const pool = require('../config/database');

/**
 * Create a notification for a user
 * @param {string} userId - The user ID to notify
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (info, warning, error, success)
 * @param {string} actionUrl - Optional URL for action
 */
async function createNotification(userId, title, message, type = 'info', actionUrl = null) {
    try {
        const result = await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, action_url)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [userId, title, message, type, actionUrl]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
}

/**
 * Create notifications for multiple users
 * @param {Array} userIds - Array of user IDs to notify
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 * @param {string} actionUrl - Optional URL for action
 */
async function createBulkNotifications(userIds, title, message, type = 'info', actionUrl = null) {
    try {
        const notifications = [];
        for (const userId of userIds) {
            const notification = await createNotification(userId, title, message, type, actionUrl);
            notifications.push(notification);
        }
        return notifications;
    } catch (error) {
        console.error('Error creating bulk notifications:', error);
        throw error;
    }
}

/**
 * Notify project team members about project-related activities
 * @param {string} projectId - Project ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 * @param {string} actionUrl - Optional URL for action
 * @param {string} excludeUserId - User ID to exclude from notifications
 */
async function notifyProjectTeam(projectId, title, message, type = 'info', actionUrl = null, excludeUserId = null) {
    try {
        // Get project manager and team members
        const teamQuery = `
            SELECT DISTINCT u.id
            FROM users u
            WHERE u.id IN (
                SELECT p.project_manager_id FROM projects p WHERE p.id = $1
                UNION
                SELECT pt.user_id FROM project_teams pt WHERE pt.project_id = $1
            )
            ${excludeUserId ? 'AND u.id != $2' : ''}
        `;
        
        const params = [projectId];
        if (excludeUserId) {
            params.push(excludeUserId);
        }
        
        const teamResult = await pool.query(teamQuery, params);
        const userIds = teamResult.rows.map(row => row.id);
        
        if (userIds.length > 0) {
            return await createBulkNotifications(userIds, title, message, type, actionUrl);
        }
        return [];
    } catch (error) {
        console.error('Error notifying project team:', error);
        throw error;
    }
}

/**
 * Notify project admins about activities requiring their attention
 * @param {string} projectId - Project ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 * @param {string} actionUrl - Optional URL for action
 */
async function notifyProjectAdmins(projectId, title, message, type = 'info', actionUrl = null) {
    try {
        // Get project admins (project manager and team members with admin role)
        const adminQuery = `
            SELECT DISTINCT u.id
            FROM users u
            WHERE u.id IN (
                SELECT p.project_manager_id FROM projects p WHERE p.id = $1
                UNION
                SELECT pt.user_id FROM project_teams pt 
                WHERE pt.project_id = $1 AND (pt.role = 'admin' OR pt.role = 'manager')
            )
        `;
        
        const adminResult = await pool.query(adminQuery, [projectId]);
        const adminIds = adminResult.rows.map(row => row.id);
        
        if (adminIds.length > 0) {
            return await createBulkNotifications(adminIds, title, message, type, actionUrl);
        }
        return [];
    } catch (error) {
        console.error('Error notifying project admins:', error);
        throw error;
    }
}

/**
 * Notify all admins about system-wide activities
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 * @param {string} actionUrl - Optional URL for action
 */
async function notifyAllAdmins(title, message, type = 'info', actionUrl = null) {
    try {
        const adminQuery = `SELECT id FROM users WHERE role = 'admin' AND is_active = true`;
        const adminResult = await pool.query(adminQuery);
        const adminIds = adminResult.rows.map(row => row.id);
        
        if (adminIds.length > 0) {
            return await createBulkNotifications(adminIds, title, message, type, actionUrl);
        }
        return [];
    } catch (error) {
        console.error('Error notifying all admins:', error);
        throw error;
    }
}

// Specific notification functions for different activities

/**
 * Notify about expense approval/rejection
 */
async function notifyExpenseStatusChange(expenseId, status, approvedBy, comments = null) {
    try {
        // Get expense details
        const expenseQuery = `
            SELECT e.*, p.name as project_name, u.full_name as submitter_name
            FROM expenses e
            JOIN projects p ON e.project_id = p.id
            JOIN users u ON e.submitted_by = u.id
            WHERE e.id = $1
        `;
        const expenseResult = await pool.query(expenseQuery, [expenseId]);
        
        if (expenseResult.rows.length === 0) return;
        
        const expense = expenseResult.rows[0];
        const statusText = status === 'approved' ? 'approved' : 'rejected';
        const type = status === 'approved' ? 'success' : 'warning';
        
        const title = `Expense ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`;
        const message = `Your expense "${expense.description}" for $${expense.amount} in project "${expense.project_name}" has been ${statusText}.${comments ? ` Comments: ${comments}` : ''}`;
        
        await createNotification(
            expense.submitted_by,
            title,
            message,
            type,
            `/expenses/${expenseId}`
        );
    } catch (error) {
        console.error('Error notifying expense status change:', error);
    }
}

/**
 * Notify about new project creation
 */
async function notifyNewProject(projectId, createdBy) {
    try {
        const projectQuery = `
            SELECT p.*, u.full_name as creator_name
            FROM projects p
            JOIN users u ON p.created_by = u.id
            WHERE p.id = $1
        `;
        const projectResult = await pool.query(projectQuery, [projectId]);
        
        if (projectResult.rows.length === 0) return;
        
        const project = projectResult.rows[0];
        
        // Notify all admins about new project
        await notifyAllAdmins(
            'New Project Created',
            `A new project "${project.name}" has been created by ${project.creator_name}.`,
            'info',
            `/projects/${projectId}`
        );
        
        // Notify project manager if different from creator
        if (project.project_manager_id && project.project_manager_id !== createdBy) {
            await createNotification(
                project.project_manager_id,
                'You\'ve Been Assigned as Project Manager',
                `You have been assigned as the project manager for "${project.name}".`,
                'info',
                `/projects/${projectId}`
            );
        }
    } catch (error) {
        console.error('Error notifying new project:', error);
    }
}

/**
 * Notify about project admin assignment
 */
async function notifyProjectAdminAssignment(projectId, userId, assignedBy) {
    try {
        const projectQuery = `SELECT name FROM projects WHERE id = $1`;
        const projectResult = await pool.query(projectQuery, [projectId]);
        
        if (projectResult.rows.length === 0) return;
        
        const project = projectResult.rows[0];
        
        await createNotification(
            userId,
            'Project Admin Assignment',
            `You have been assigned as an admin for project "${project.name}".`,
            'info',
            `/projects/${projectId}`
        );
    } catch (error) {
        console.error('Error notifying project admin assignment:', error);
    }
}

/**
 * Notify about budget changes
 */
async function notifyBudgetChange(projectId, categoryName, oldAmount, newAmount, changedBy) {
    try {
        const projectQuery = `SELECT name FROM projects WHERE id = $1`;
        const projectResult = await pool.query(projectQuery, [projectId]);
        
        if (projectResult.rows.length === 0) return;
        
        const project = projectResult.rows[0];
        const changeType = newAmount > oldAmount ? 'increased' : 'decreased';
        
        await notifyProjectTeam(
            projectId,
            'Budget Updated',
            `Budget for "${categoryName}" in project "${project.name}" has been ${changeType} from $${oldAmount} to $${newAmount}.`,
            'info',
            `/projects/${projectId}/budget`,
            changedBy
        );
    } catch (error) {
        console.error('Error notifying budget change:', error);
    }
}

/**
 * Notify about new expense submission requiring approval
 */
async function notifyNewExpenseSubmission(expenseId) {
    try {
        const expenseQuery = `
            SELECT e.*, p.name as project_name, u.full_name as submitter_name
            FROM expenses e
            JOIN projects p ON e.project_id = p.id
            JOIN users u ON e.submitted_by = u.id
            WHERE e.id = $1
        `;
        const expenseResult = await pool.query(expenseQuery, [expenseId]);
        
        if (expenseResult.rows.length === 0) return;
        
        const expense = expenseResult.rows[0];
        
        await notifyProjectAdmins(
            expense.project_id,
            'New Expense Requires Approval',
            `${expense.submitter_name} submitted an expense "${expense.description}" for $${expense.amount} in project "${expense.project_name}".`,
            'warning',
            `/expenses/${expenseId}`
        );
    } catch (error) {
        console.error('Error notifying new expense submission:', error);
    }
}

module.exports = {
    createNotification,
    createBulkNotifications,
    notifyProjectTeam,
    notifyProjectAdmins,
    notifyAllAdmins,
    notifyExpenseStatusChange,
    notifyNewProject,
    notifyProjectAdminAssignment,
    notifyBudgetChange,
    notifyNewExpenseSubmission
};