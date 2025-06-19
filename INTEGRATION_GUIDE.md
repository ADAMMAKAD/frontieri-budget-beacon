# PBMS Full Stack Integration Guide

This guide will help you connect all frontend components and admin functionality to the PostgreSQL database with real data.

## 🚀 Quick Start

### Prerequisites
- PostgreSQL 12+ installed and running
- Node.js 16+ installed
- npm or yarn package manager

### Step 1: Database Setup

1. **Start PostgreSQL service:**
   ```bash
   # On macOS with Homebrew
   brew services start postgresql
   
   # Or start manually
   pg_ctl -D /usr/local/var/postgres start
   ```

2. **Create and setup the database:**
   ```bash
   # Connect to PostgreSQL as superuser
   psql postgres
   
   # Run the setup script
   \i /path/to/your/project/backend/setup-database.sql
   
   # Or create database manually and run script
   CREATE DATABASE pbms_db_new;
   \c pbms_db_new
   \i /path/to/your/project/backend/setup-database.sql
   ```

3. **Verify database setup:**
   ```sql
   -- Check if tables are created
   \dt
   
   -- Check sample data
   SELECT * FROM users;
   SELECT * FROM projects;
   SELECT * FROM business_units;
   ```

### Step 2: Backend Configuration

1. **Update environment variables:**
   ```bash
   cd backend
   # Edit .env file with your database credentials
   ```
   
   Ensure your `.env` file has:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=pbms_db_new
   DB_USER=postgres
   DB_PASSWORD=your_actual_password
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_secure_123456789
   JWT_EXPIRES_IN=7d
   PORT=3001
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Test database connection:**
   ```bash
   # Start the backend server
   npm run dev
   
   # Check health endpoint
   curl http://localhost:3001/health
   ```

### Step 3: Frontend Configuration

1. **Install frontend dependencies:**
   ```bash
   cd .. # Go back to project root
   npm install
   ```

2. **Verify API configuration:**
   Check that `src/lib/api.ts` has the correct backend URL:
   ```typescript
   const API_BASE_URL = 'http://localhost:3001/api';
   ```

3. **Start the frontend:**
   ```bash
   npm run dev
   ```

### Step 4: Test the Integration

1. **Login with sample accounts:**
   - Admin: `admin@pbms.com` / `password`
   - Manager: `manager@pbms.com` / `password`
   - User: `user@pbms.com` / `password`

2. **Verify data flow:**
   - Dashboard should show real project data
   - Projects page should display sample projects
   - Admin panel should show activity logs
   - Business units should be populated

## 🔧 Component-by-Component Integration

### Dashboard Components

#### OverviewDashboard
- **Data Sources:** Projects, Business Units, Expenses, Milestones
- **API Endpoints:**
  - `GET /api/projects` - Project list with filtering
  - `GET /api/business-units` - Business units data
  - `GET /api/projects/dashboard/metrics` - Dashboard metrics

#### DashboardMetrics
- **Real-time calculations from database:**
  - Total budget from projects table
  - Active projects count
  - Budget utilization percentage
  - Expense approvals pending

### Project Management

#### ProjectGridView & ProjectListView
- **Data Source:** `projects` table with joins
- **Features:**
  - Real-time project status
  - Budget tracking
  - Team member counts
  - Progress indicators

#### ProjectDetails
- **Data Sources:** Projects, Expenses, Milestones, Team Members
- **API Endpoints:**
  - `GET /api/projects/:id` - Project details
  - `GET /api/expenses/project/:id` - Project expenses
  - `GET /api/project-milestones?project_id=:id` - Milestones

### Admin Panel

#### AdminDashboard
- **Data Sources:** All tables for comprehensive overview
- **Features:**
  - User management
  - System activity logs
  - Budget oversight
  - Approval workflows

#### UserManagement
- **Data Source:** `users` and `profiles` tables
- **Features:**
  - User CRUD operations
  - Role management
  - Department assignments

### Budget Management

#### BudgetCategories
- **Data Source:** `budget_categories` table
- **Features:**
  - Category allocation
  - Spending tracking
  - Budget version control

#### ExpenseTracking
- **Data Source:** `expenses` table with joins
- **Features:**
  - Expense submission
  - Approval workflows
  - Receipt management

## 🔌 API Endpoints Reference

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Current user info
- `POST /api/auth/logout` - User logout

### Projects
- `GET /api/projects` - List projects (with filtering)
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/dashboard/metrics` - Dashboard metrics

### Business Units
- `GET /api/business-units` - List business units
- `POST /api/business-units` - Create business unit
- `PUT /api/business-units/:id` - Update business unit
- `DELETE /api/business-units/:id` - Delete business unit

### Expenses
- `GET /api/expenses` - List all expenses
- `GET /api/expenses/project/:id` - Project expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Budget Categories
- `GET /api/budget-categories` - List categories
- `POST /api/budget-categories` - Create category
- `PUT /api/budget-categories/:id` - Update category
- `DELETE /api/budget-categories/:id` - Delete category

### Admin
- `GET /api/admin/activity-log` - System activity logs
- `GET /api/admin/users` - User management
- `GET /api/admin/expenses` - All expenses overview

### Notifications
- `GET /api/notifications` - User notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/:id/read` - Mark as read

## 🛠️ Advanced Configuration

### Database Optimization

1. **Indexes for performance:**
   ```sql
   -- Already included in setup script
   CREATE INDEX idx_projects_status ON projects(status);
   CREATE INDEX idx_expenses_project ON expenses(project_id);
   ```

2. **Connection pooling:**
   ```javascript
   // Already configured in config/database.js
   const pool = new Pool({
     max: 20,
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   ```

### Security Enhancements

1. **JWT Configuration:**
   - Use strong secret keys
   - Set appropriate expiration times
   - Implement refresh tokens for production

2. **Database Security:**
   - Use environment variables for credentials
   - Implement row-level security
   - Regular backup procedures

### Real-time Features

1. **WebSocket Integration (Optional):**
   ```bash
   npm install socket.io
   ```

2. **Real-time notifications:**
   - Budget alerts
   - Expense approvals
   - Project updates

## 🧪 Testing the Integration

### Backend API Testing
```bash
# Test authentication
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pbms.com","password":"password"}'

# Test projects endpoint (with token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/projects
```

### Frontend Testing
1. Open browser to `http://localhost:5173`
2. Login with sample credentials
3. Navigate through all components
4. Verify data is loading from database
5. Test CRUD operations

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed:**
   - Check PostgreSQL is running
   - Verify credentials in .env
   - Check database exists

2. **CORS Errors:**
   - Verify CLIENT_URL in backend .env
   - Check frontend API_BASE_URL

3. **Authentication Issues:**
   - Check JWT_SECRET is set
   - Verify token storage in localStorage
   - Check token expiration

4. **Data Not Loading:**
   - Check browser console for errors
   - Verify API endpoints are responding
   - Check database has sample data

### Debug Commands
```bash
# Check database connection
psql -h localhost -U postgres -d pbms_db_new -c "SELECT COUNT(*) FROM users;"

# Check backend logs
cd backend && npm run dev

# Check frontend console
# Open browser dev tools and check console/network tabs
```

## 📈 Next Steps

1. **Production Deployment:**
   - Set up production database
   - Configure environment variables
   - Implement proper logging
   - Set up monitoring

2. **Additional Features:**
   - File upload for receipts
   - Email notifications
   - Advanced reporting
   - Data export functionality

3. **Performance Optimization:**
   - Database query optimization
   - Frontend code splitting
   - Caching strategies
   - CDN integration

## 🎯 Success Criteria

After completing this integration, you should have:
- ✅ All components displaying real database data
- ✅ Full CRUD operations working
- ✅ User authentication and authorization
- ✅ Admin panel with real functionality
- ✅ Dashboard with live metrics
- ✅ Project management with real data
- ✅ Budget tracking and expense management

Your PBMS system is now fully integrated and ready for use!