
-- First, add the new enum value and commit it
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'project_admin';
