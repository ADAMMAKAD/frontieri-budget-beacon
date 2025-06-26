-- Migration to add project admin role and permissions

-- Update project_teams table to include 'admin' role
ALTER TABLE project_teams 
DROP CONSTRAINT IF EXISTS project_teams_role_check;

ALTER TABLE project_teams 
ADD CONSTRAINT project_teams_role_check 
CHECK (role IN ('admin', 'manager', 'lead', 'member', 'viewer'));

-- Create project_permissions table to define specific permissions
CREATE TABLE IF NOT EXISTS project_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role_permissions table to map roles to permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(50) NOT NULL,
    permission_name VARCHAR(100) REFERENCES project_permissions(name),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role, permission_name)
);

-- Insert project permissions
INSERT INTO project_permissions (name, description) VALUES
('approve_expenses', 'Can approve or reject project expenses'),
('manage_budget', 'Can create and modify budget categories'),
('manage_team', 'Can add/remove team members and assign roles'),
('view_analytics', 'Can view project analytics and reports'),
('manage_milestones', 'Can create, edit, and delete project milestones'),
('delete_expenses', 'Can delete any project expense'),
('export_data', 'Can export project data and reports'),
('manage_project_settings', 'Can modify project settings and details')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
-- Project Admin (highest project-level permissions)
INSERT INTO role_permissions (role, permission_name) VALUES
('admin', 'approve_expenses'),
('admin', 'manage_budget'),
('admin', 'manage_team'),
('admin', 'view_analytics'),
('admin', 'manage_milestones'),
('admin', 'delete_expenses'),
('admin', 'export_data'),
('admin', 'manage_project_settings')
ON CONFLICT (role, permission_name) DO NOTHING;

-- Project Manager (similar to admin but cannot manage team roles)
INSERT INTO role_permissions (role, permission_name) VALUES
('manager', 'approve_expenses'),
('manager', 'manage_budget'),
('manager', 'view_analytics'),
('manager', 'manage_milestones'),
('manager', 'export_data'),
('manager', 'manage_project_settings')
ON CONFLICT (role, permission_name) DO NOTHING;

-- Project Lead (limited management permissions)
INSERT INTO role_permissions (role, permission_name) VALUES
('lead', 'view_analytics'),
('lead', 'manage_milestones')
ON CONFLICT (role, permission_name) DO NOTHING;

-- Member and Viewer have no special permissions (handled by application logic)

-- Update existing 'manager' roles to 'admin' where appropriate
-- This is optional - you may want to review these manually
-- UPDATE project_teams SET role = 'admin' WHERE role = 'manager';

COMMIT;