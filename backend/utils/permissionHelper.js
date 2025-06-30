const pool = require('../config/database');

/**
 * Check if a user has a specific permission for a project
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @param {string} permissionName - Permission name to check
 * @returns {boolean} - Whether user has the permission
 */
async function hasProjectPermission(userId, projectId, permissionName) {
    try {
        const query = `
            SELECT 1
            FROM project_teams pt
            JOIN role_permissions rp ON pt.role = rp.role
            WHERE pt.user_id = $1 
            AND pt.project_id = $2 
            AND rp.permission_name = $3
        `;
        
        const result = await pool.query(query, [userId, projectId, permissionName]);
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error checking project permission:', error);
        return false;
    }
}

/**
 * Check if a user is a project admin (has admin role)
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @returns {boolean} - Whether user is project admin
 */
async function isProjectAdmin(userId, projectId) {
    try {
        const query = `
            SELECT 1
            FROM project_teams pt
            WHERE pt.user_id = $1 
            AND pt.project_id = $2 
            AND pt.role = 'admin'
        `;
        
        const result = await pool.query(query, [userId, projectId]);
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error checking project admin status:', error);
        return false;
    }
}

/**
 * Get all permissions for a user in a specific project
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @returns {Array} - Array of permission names
 */
async function getUserProjectPermissions(userId, projectId) {
    try {
        const query = `
            SELECT DISTINCT rp.permission_name
            FROM project_teams pt
            JOIN role_permissions rp ON pt.role = rp.role
            WHERE pt.user_id = $1 AND pt.project_id = $2
        `;
        
        const result = await pool.query(query, [userId, projectId]);
        return result.rows.map(row => row.permission_name);
    } catch (error) {
        console.error('Error getting user project permissions:', error);
        return [];
    }
}

/**
 * Get all projects where user has a specific permission
 * @param {string} userId - User ID
 * @param {string} permissionName - Permission name
 * @returns {Array} - Array of project IDs
 */
async function getUserProjectsWithPermission(userId, permissionName) {
    try {
        const query = `
            SELECT DISTINCT pt.project_id
            FROM project_teams pt
            JOIN role_permissions rp ON pt.role = rp.role
            WHERE pt.user_id = $1 AND rp.permission_name = $2
        `;
        
        const result = await pool.query(query, [userId, permissionName]);
        return result.rows.map(row => row.project_id);
    } catch (error) {
        console.error('Error getting user projects with permission:', error);
        return [];
    }
}

/**
 * Check if a user is the project creator/manager
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @returns {boolean} - Whether user is the project creator
 */
async function isProjectCreator(userId, projectId) {
    try {
        const query = `
            SELECT 1
            FROM projects
            WHERE id = $1 AND project_manager_id = $2
        `;
        
        const result = await pool.query(query, [projectId, userId]);
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error checking project creator status:', error);
        return false;
    }
}

/**
 * Get all projects where user is admin
 * @param {string} userId - User ID
 * @param {string} userRole - User role (optional)
 * @returns {Array} - Array of project IDs
 */
async function getUserAdminProjects(userId, userRole = null) {
    try {
        let query;
        let queryParams;
        
        // Managers and admins can see all projects for administrative purposes
        if (userRole === 'admin' || userRole === 'manager') {
            query = `SELECT id as project_id FROM projects`;
            queryParams = [];
        } else {
            // Other users only see projects where they are explicitly assigned as admin
            query = `
                SELECT project_id
                FROM project_teams
                WHERE user_id = $1 AND role = 'admin'
            `;
            queryParams = [userId];
        }
        
        const result = await pool.query(query, queryParams);
        return result.rows.map(row => row.project_id);
    } catch (error) {
        console.error('Error getting user admin projects:', error);
        return [];
    }
}

/**
 * Middleware to check project permission
 * @param {string} permissionName - Required permission
 * @returns {Function} - Express middleware function
 */
function requireProjectPermission(permissionName) {
    return async (req, res, next) => {
        try {
            const { id: projectId } = req.params;
            const userId = req.user.id;
            
            // System admins bypass project permissions
            if (req.user.role === 'admin') {
                return next();
            }
            
            const hasPermission = await hasProjectPermission(userId, projectId, permissionName);
            
            if (!hasPermission) {
                return res.status(403).json({ 
                    error: `Insufficient permissions. Required: ${permissionName}` 
                });
            }
            
            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({ error: 'Permission check failed' });
        }
    };
}

/**
 * Middleware to check if user is project admin
 * @returns {Function} - Express middleware function
 */
function requireProjectAdmin() {
    return async (req, res, next) => {
        try {
            const { id: projectId } = req.params;
            const userId = req.user.id;
            
            // System admins bypass project permissions
            if (req.user.role === 'admin') {
                return next();
            }
            
            const isAdmin = await isProjectAdmin(userId, projectId);
            
            if (!isAdmin) {
                return res.status(403).json({ 
                    error: 'Project admin access required' 
                });
            }
            
            next();
        } catch (error) {
            console.error('Project admin check error:', error);
            res.status(500).json({ error: 'Permission check failed' });
        }
    };
}

module.exports = {
    hasProjectPermission,
    isProjectAdmin,
    isProjectCreator,
    getUserProjectPermissions,
    getUserProjectsWithPermission,
    getUserAdminProjects,
    requireProjectPermission,
    requireProjectAdmin
};