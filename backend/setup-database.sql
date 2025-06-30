-- PBMS Database Setup Script
-- Run this script to create a fresh database with all required tables

-- Drop existing database if it exists and create new one
DROP DATABASE IF EXISTS pbms_db_new;
CREATE DATABASE pbms_db_new;

-- Connect to the new database
\c pbms_db_new;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (main authentication table)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create business_units table
CREATE TABLE business_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    manager_id UUID REFERENCES users(id),
    budget_allocation DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table (extended user information)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES users(id),
    full_name VARCHAR(255),
    department VARCHAR(100),
    team_id UUID REFERENCES business_units(id),
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    avatar_url TEXT,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    department VARCHAR(100),
    project_manager_id UUID REFERENCES users(id),
    business_unit_id UUID REFERENCES business_units(id),
    team_id UUID REFERENCES business_units(id),
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    total_budget DECIMAL(15,2) DEFAULT 0,
    allocated_budget DECIMAL(15,2) DEFAULT 0,
    spent_budget DECIMAL(15,2) DEFAULT 0,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_teams table (many-to-many relationship)
CREATE TABLE project_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('manager', 'lead', 'member', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Create budget_versions table
CREATE TABLE budget_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    version_number INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create budget_categories table
CREATE TABLE budget_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    budget_version_id UUID REFERENCES budget_versions(id),
    name VARCHAR(255) NOT NULL,
    allocated_amount DECIMAL(15,2) DEFAULT 0,
    spent_amount DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    category_id UUID REFERENCES budget_categories(id),
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    expense_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    submitted_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_milestones table
CREATE TABLE project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'overdue')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create approval_workflows table
CREATE TABLE approval_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    expense_id UUID REFERENCES expenses(id),
    approver_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_activity_log table
CREATE TABLE admin_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    target_table VARCHAR(100) NOT NULL,
    target_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table (for additional role management)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_manager ON projects(project_manager_id);
CREATE INDEX idx_projects_business_unit ON projects(business_unit_id);
CREATE INDEX idx_expenses_project ON expenses(project_id);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_project_teams_project ON project_teams(project_id);
CREATE INDEX idx_project_teams_user ON project_teams(user_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_units_updated_at BEFORE UPDATE ON business_units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_milestones_updated_at BEFORE UPDATE ON project_milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_approval_workflows_updated_at BEFORE UPDATE ON approval_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data

-- Insert admin user
INSERT INTO users (email, password_hash, full_name, department, role) VALUES 
('admin@pbms.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'System Administrator', 'IT', 'admin'),
('manager@pbms.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Project Manager', 'Operations', 'manager'),
('user@pbms.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Regular User', 'Development', 'user');

-- Insert business units
INSERT INTO business_units (name, description, budget_allocation) VALUES 
('Engineering', 'Software development and technical operations', 500000.00),
('Marketing', 'Marketing and customer acquisition', 200000.00),
('Operations', 'Business operations and support', 300000.00),
('Finance', 'Financial planning and analysis', 150000.00);

-- Insert sample projects
INSERT INTO projects (name, description, start_date, end_date, status, total_budget, allocated_budget, spent_budget, progress, project_manager_id, business_unit_id) 
SELECT 
    'E-Commerce Platform Upgrade',
    'Modernize the existing e-commerce platform with new features and improved performance',
    '2024-01-15',
    '2024-06-30',
    'active',
    150000.00,
    120000.00,
    45000.00,
    35,
    u.id,
    bu.id
FROM users u, business_units bu 
WHERE u.email = 'manager@pbms.com' AND bu.name = 'Engineering'
LIMIT 1;

INSERT INTO projects (name, description, start_date, end_date, status, total_budget, allocated_budget, spent_budget, progress, project_manager_id, business_unit_id) 
SELECT 
    'Marketing Campaign Q1',
    'Digital marketing campaign for Q1 product launch',
    '2024-01-01',
    '2024-03-31',
    'completed',
    75000.00,
    75000.00,
    72000.00,
    100,
    u.id,
    bu.id
FROM users u, business_units bu 
WHERE u.email = 'manager@pbms.com' AND bu.name = 'Marketing'
LIMIT 1;

INSERT INTO projects (name, description, start_date, end_date, status, total_budget, allocated_budget, spent_budget, progress, project_manager_id, business_unit_id) 
SELECT 
    'Office Infrastructure Upgrade',
    'Upgrade office network and hardware infrastructure',
    '2024-02-01',
    '2024-04-30',
    'planning',
    100000.00,
    80000.00,
    15000.00,
    15,
    u.id,
    bu.id
FROM users u, business_units bu 
WHERE u.email = 'manager@pbms.com' AND bu.name = 'Operations'
LIMIT 1;

-- Insert budget categories for the first project
INSERT INTO budget_categories (project_id, name, allocated_amount, spent_amount)
SELECT 
    p.id,
    'Development',
    80000.00,
    30000.00
FROM projects p WHERE p.name = 'E-Commerce Platform Upgrade';

INSERT INTO budget_categories (project_id, name, allocated_amount, spent_amount)
SELECT 
    p.id,
    'Testing & QA',
    25000.00,
    10000.00
FROM projects p WHERE p.name = 'E-Commerce Platform Upgrade';

INSERT INTO budget_categories (project_id, name, allocated_amount, spent_amount)
SELECT 
    p.id,
    'Infrastructure',
    15000.00,
    5000.00
FROM projects p WHERE p.name = 'E-Commerce Platform Upgrade';

-- Insert sample expenses
INSERT INTO expenses (project_id, category_id, description, amount, expense_date, status, submitted_by)
SELECT 
    p.id,
    bc.id,
    'Frontend development services',
    15000.00,
    '2024-01-20',
    'approved',
    u.id
FROM projects p, budget_categories bc, users u
WHERE p.name = 'E-Commerce Platform Upgrade' 
    AND bc.name = 'Development' 
    AND u.email = 'user@pbms.com';

INSERT INTO expenses (project_id, category_id, description, amount, expense_date, status, submitted_by)
SELECT 
    p.id,
    bc.id,
    'Backend API development',
    12000.00,
    '2024-01-25',
    'approved',
    u.id
FROM projects p, budget_categories bc, users u
WHERE p.name = 'E-Commerce Platform Upgrade' 
    AND bc.name = 'Development' 
    AND u.email = 'user@pbms.com';

-- Insert project milestones
INSERT INTO project_milestones (project_id, title, description, due_date, status, progress, created_by)
SELECT 
    p.id,
    'Requirements Analysis Complete',
    'Complete analysis of all project requirements',
    '2024-02-15',
    'completed',
    100,
    u.id
FROM projects p, users u
WHERE p.name = 'E-Commerce Platform Upgrade' AND u.email = 'manager@pbms.com';

INSERT INTO project_milestones (project_id, title, description, due_date, status, progress, created_by)
SELECT 
    p.id,
    'Frontend Development Phase 1',
    'Complete first phase of frontend development',
    '2024-03-30',
    'in_progress',
    60,
    u.id
FROM projects p, users u
WHERE p.name = 'E-Commerce Platform Upgrade' AND u.email = 'manager@pbms.com';

-- Insert notifications
INSERT INTO notifications (user_id, title, message, type)
SELECT 
    u.id,
    'Budget Alert',
    'Project "E-Commerce Platform Upgrade" has exceeded 30% of allocated budget',
    'warning'
FROM users u WHERE u.email = 'manager@pbms.com';

INSERT INTO notifications (user_id, title, message, type)
SELECT 
    u.id,
    'Expense Approved',
    'Your expense submission for "Frontend development services" has been approved',
    'success'
FROM users u WHERE u.email = 'user@pbms.com';

-- Create profiles for all users
INSERT INTO profiles (id, full_name, department, email, role)
SELECT id, full_name, department, email, role FROM users;-- Display login credentials
-- Database setup completed successfully!
-- Default login credentials:
-- Admin: admin@pbms.com / password
-- Manager: manager@pbms.com / password
-- User: user@pbms.com / password