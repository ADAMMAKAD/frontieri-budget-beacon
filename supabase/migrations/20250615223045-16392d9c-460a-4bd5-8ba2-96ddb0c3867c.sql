
-- Insert demo business units
INSERT INTO public.business_units (id, name, description, manager_id, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Engineering', 'Software development and technical operations', null, now(), now()),
('550e8400-e29b-41d4-a716-446655440002', 'Marketing', 'Brand management and customer acquisition', null, now(), now()),
('550e8400-e29b-41d4-a716-446655440003', 'Sales', 'Revenue generation and client relations', null, now(), now()),
('550e8400-e29b-41d4-a716-446655440004', 'Human Resources', 'Employee management and organizational development', null, now(), now()),
('550e8400-e29b-41d4-a716-446655440005', 'Finance', 'Financial planning and budget management', null, now(), now());

-- Insert demo projects
INSERT INTO public.projects (id, name, description, status, total_budget, allocated_budget, spent_budget, start_date, end_date, department, business_unit_id, team_id, project_manager_id, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'Website Redesign', 'Complete overhaul of company website with modern UI/UX', 'active', 150000, 120000, 85000, '2024-01-15', '2024-06-30', 'Engineering', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', null, now(), now()),
('550e8400-e29b-41d4-a716-446655440011', 'Mobile App Development', 'Native mobile application for iOS and Android', 'planning', 250000, 200000, 45000, '2024-03-01', '2024-12-31', 'Engineering', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', null, now(), now()),
('550e8400-e29b-41d4-a716-446655440012', 'Marketing Campaign Q2', 'Digital marketing campaign for product launch', 'active', 75000, 70000, 32000, '2024-04-01', '2024-06-30', 'Marketing', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', null, now(), now()),
('550e8400-e29b-41d4-a716-446655440013', 'Sales Training Program', 'Comprehensive training program for sales team', 'completed', 35000, 35000, 34500, '2024-01-01', '2024-03-31', 'Sales', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', null, now(), now()),
('550e8400-e29b-41d4-a716-446655440014', 'Office Renovation', 'Modernization of office spaces and facilities', 'on_hold', 180000, 150000, 25000, '2024-05-01', '2024-08-31', 'Human Resources', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', null, now(), now());

-- Insert demo budget categories
INSERT INTO public.budget_categories (id, project_id, name, allocated_amount, spent_amount, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', 'Development Team', 80000, 55000, now()),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440010', 'Design & UX', 25000, 18000, now()),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440010', 'Testing & QA', 15000, 12000, now()),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440011', 'iOS Development', 100000, 20000, now()),
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440011', 'Android Development', 100000, 25000, now()),
('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440012', 'Digital Advertising', 45000, 20000, now()),
('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440012', 'Content Creation', 25000, 12000, now());

-- Insert demo expenses
INSERT INTO public.expenses (id, project_id, category_id, description, amount, expense_date, status, submitted_by, approved_by, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440020', 'Frontend developer salary - March', 8500, '2024-03-31', 'approved', null, null, now()),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440021', 'UI/UX design tools license', 2500, '2024-03-15', 'approved', null, null, now()),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440023', 'iOS development tools', 1500, '2024-04-01', 'pending', null, null, now()),
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440025', 'Google Ads campaign', 15000, '2024-04-15', 'approved', null, null, now());

-- Insert demo project milestones
INSERT INTO public.project_milestones (id, project_id, title, description, due_date, status, progress, created_by, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440010', 'Design Phase Complete', 'Finish all UI/UX designs and wireframes', '2024-02-28', 'completed', 100, null, now(), now()),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440010', 'Frontend Development', 'Complete frontend development and integration', '2024-05-15', 'in_progress', 75, null, now(), now()),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440011', 'Technical Architecture', 'Define app architecture and tech stack', '2024-04-30', 'in_progress', 60, null, now(), now()),
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440012', 'Campaign Launch', 'Launch digital marketing campaign', '2024-04-01', 'completed', 100, null, now(), now());

-- Insert demo notifications
INSERT INTO public.notifications (id, user_id, title, message, type, read, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440050', null, 'Budget Alert', 'Website Redesign project is approaching 90% budget utilization', 'warning', false, now()),
('550e8400-e29b-41d4-a716-446655440051', null, 'Milestone Completed', 'Design Phase has been completed for Website Redesign project', 'success', true, now() - interval '2 days'),
('550e8400-e29b-41d4-a716-446655440052', null, 'New Expense Submitted', 'A new expense has been submitted for approval in Mobile App Development', 'info', false, now() - interval '1 hour'),
('550e8400-e29b-41d4-a716-446655440053', null, 'Project Deadline', 'Marketing Campaign Q2 deadline is approaching in 15 days', 'warning', false, now() - interval '3 hours');
