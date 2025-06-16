
# PBMS Backend

Project Budget Management System - Express.js Backend

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Database Setup
1. Install PostgreSQL on your system
2. Create a new database:
```sql
CREATE DATABASE pbms_db;
```

### 3. Environment Configuration
1. Copy `.env.example` to `.env`
2. Update the database credentials and other settings in `.env`

### 4. Run Migrations
```bash
npm run migrate
```

### 5. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - Get projects (with pagination, search, filtering)
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

## Database Schema

The database includes tables for:
- Users (authentication)
- Profiles
- Business Units
- Projects
- Budget Versions
- Budget Categories
- Expenses
- Project Milestones
- Project Teams
- Approval Workflows
- Notifications
- User Roles
- Admin Activity Log

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation with express-validator
- Role-based access control

## Next Steps

After setting up the backend, you'll need to update the frontend to use the new API endpoints instead of Supabase.
