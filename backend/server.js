
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const adminRoutes = require('./routes/admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'development' ? true : process.env.CLIENT_URL,
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
    message: {
        error: 'Too many requests from this IP, please try again later.'
    }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/business-units', require('./routes/business-units'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/budget-categories', require('./routes/budget-categories'));
app.use('/api/budget-versions', require('./routes/budget-versions'));
app.use('/api/project-milestones', require('./routes/project-milestones'));
app.use('/api/project-teams', require('./routes/project-teams'));
app.use('/api/project-admin', require('./routes/project-admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', require('./routes/analytics'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Also accessible via http://localhost:${PORT}`);
});

module.exports = app;
