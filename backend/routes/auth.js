
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').notEmpty().trim(),
    body('department').notEmpty().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, fullName, department, role = 'user' } = req.body;

        // Check if user exists
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const userResult = await pool.query(
            'INSERT INTO users (email, password_hash, full_name, department, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, department, role',
            [email, hashedPassword, fullName, department, role]
        );

        const user = userResult.rows[0];

        // Create profile
        await pool.query(
            'INSERT INTO profiles (id, full_name, department, role, email) VALUES ($1, $2, $3, $4, $5)',
            [user.id, fullName, department, role, email]
        );

        // Generate token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                department: user.department,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Get user
        const result = await pool.query(
            'SELECT id, email, password_hash, full_name, department, role FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                department: user.department,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, full_name, department, role, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});
// POST /auth/2fa/setup - Setup 2FA
// POST /auth/2fa/verify - Verify 2FA

// GET /auth/profile/:id - Get user profile
router.get('/profile/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if user can access this profile (own profile or admin)
        if (req.user.id !== id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await pool.query(
            'SELECT u.id, u.email, u.full_name, u.department, u.role, u.created_at FROM users u WHERE u.id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// PUT /auth/profile/:id - Update user profile
router.put('/profile/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, department } = req.body;
        
        // Check if user can update this profile (own profile or admin)
        if (req.user.id !== id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await pool.query(
            'UPDATE users SET full_name = $1, department = $2, updated_at = NOW() WHERE id = $3 RETURNING id, email, full_name, department, role',
            [full_name, department, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json({ message: 'Profile updated successfully', user: result.rows[0] });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Add user count endpoint
router.get('/users/count', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM users');
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
