
-- WARNING: This schema is for context only and is not meant to be run. 
 -- Table order and constraints may not be valid for execution. 
 
 CREATE TABLE public.admin_activity_log ( 
   admin_id uuid NOT NULL, 
   action text NOT NULL, 
   target_table text NOT NULL, 
   target_id uuid, 
   details jsonb, 
   id uuid NOT NULL DEFAULT gen_random_uuid(), 
   created_at timestamp with time zone NOT NULL DEFAULT now(), 
   CONSTRAINT admin_activity_log_pkey PRIMARY KEY (id), 
   CONSTRAINT admin_activity_log_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id) 
 ); 
 CREATE TABLE public.approval_workflows ( 
   project_id uuid, 
   expense_id uuid, 
   approver_id uuid, 
   comments text, 
   id uuid NOT NULL DEFAULT gen_random_uuid(), 
   status text NOT NULL DEFAULT 'pending'::text, 
   created_at timestamp with time zone NOT NULL DEFAULT now(), 
   updated_at timestamp with time zone NOT NULL DEFAULT now(), 
   CONSTRAINT approval_workflows_pkey PRIMARY KEY (id), 
   CONSTRAINT approval_workflows_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id), 
   CONSTRAINT approval_workflows_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES public.expenses(id), 
   CONSTRAINT approval_workflows_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES auth.users(id) 
 ); 
 CREATE TABLE public.budget_categories ( 
   project_id uuid, 
   name text NOT NULL, 
   budget_version_id uuid, 
   id uuid NOT NULL DEFAULT gen_random_uuid(), 
   allocated_amount numeric DEFAULT 0, 
   spent_amount numeric DEFAULT 0, 
   created_at timestamp with time zone DEFAULT now(), 
   CONSTRAINT budget_categories_pkey PRIMARY KEY (id), 
   CONSTRAINT budget_categories_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id), 
   CONSTRAINT budget_categories_budget_version_id_fkey FOREIGN KEY (budget_version_id) REFERENCES public.budget_versions(id) 
 ); 
 CREATE TABLE public.budget_versions ( 
   project_id uuid, 
   title text NOT NULL, 
   description text, 
   created_by uuid, 
   approved_by uuid, 
   approved_at timestamp with time zone, 
   id uuid NOT NULL DEFAULT gen_random_uuid(), 
   version_number integer NOT NULL DEFAULT 1, 
   status text NOT NULL DEFAULT 'draft'::text, 
   created_at timestamp with time zone NOT NULL DEFAULT now(), 
   CONSTRAINT budget_versions_pkey PRIMARY KEY (id), 
   CONSTRAINT budget_versions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id), 
   CONSTRAINT budget_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id), 
   CONSTRAINT budget_versions_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id) 
 ); 
 CREATE TABLE public.business_units ( 
   name text NOT NULL, 
   description text, 
   manager_id uuid, 
   id uuid NOT NULL DEFAULT gen_random_uuid(), 
   created_at timestamp with time zone NOT NULL DEFAULT now(), 
   updated_at timestamp with time zone NOT NULL DEFAULT now(), 
   CONSTRAINT business_units_pkey PRIMARY KEY (id), 
   CONSTRAINT business_units_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES auth.users(id) 
 ); 
 CREATE TABLE public.expenses ( 
   project_id uuid, 
   category_id uuid, 
   description text NOT NULL, 
   amount numeric NOT NULL, 
   submitted_by uuid, 
   approved_by uuid, 
   id uuid NOT NULL DEFAULT gen_random_uuid(), 
   expense_date date DEFAULT CURRENT_DATE, 
   status text DEFAULT 'pending'::text, 
   created_at timestamp with time zone DEFAULT now(), 
   CONSTRAINT expenses_pkey PRIMARY KEY (id), 
   CONSTRAINT expenses_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id), 
   CONSTRAINT expenses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.budget_categories(id), 
   CONSTRAINT expenses_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id), 
   CONSTRAINT expenses_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES auth.users(id) 
 ); 
 CREATE TABLE public.notifications ( 
   user_id uuid, 
   title text NOT NULL, 
   message text NOT NULL, 
   id uuid NOT NULL DEFAULT gen_random_uuid(), 
   type text NOT NULL DEFAULT 'info'::text, 
   read boolean NOT NULL DEFAULT false, 
   created_at timestamp with time zone NOT NULL DEFAULT now(), 
   CONSTRAINT notifications_pkey PRIMARY KEY (id), 
   CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) 
 ); 
 CREATE TABLE public.profiles ( 
   id uuid NOT NULL, 
   full_name text, 
   department text, 
   team_id uuid, 
   email text, 
   role text DEFAULT 'user'::text, 
   created_at timestamp with time zone DEFAULT now(), 
   updated_at timestamp with time zone DEFAULT now(), 
   CONSTRAINT profiles_pkey PRIMARY KEY (id), 
   CONSTRAINT profiles_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.business_units(id), 
   CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) 
 ); 
 CREATE TABLE public.project_milestones ( 
   project_id uuid, 
   title text NOT NULL, 
   description text, 
   due_date date NOT NULL, 
   created_by uuid, 
   id uuid NOT NULL DEFAULT gen_random_uuid(), 
   status text NOT NULL DEFAULT 'not_started'::text CHECK (status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text, 'overdue'::text])), 
   progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100), 
   created_at timestamp with time zone NOT NULL DEFAULT now(), 
   updated_at timestamp with time zone NOT NULL DEFAULT now(), 
   CONSTRAINT project_milestones_pkey PRIMARY KEY (id), 
   CONSTRAINT project_milestones_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id), 
   CONSTRAINT project_milestones_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) 
 ); 
 CREATE TABLE public.project_teams ( 
   project_id uuid, 
   user_id uuid, 
   id uuid NOT NULL DEFAULT gen_random_uuid(), 
   role text NOT NULL DEFAULT 'member'::text, 
   created_at timestamp with time zone NOT NULL DEFAULT now(), 
   CONSTRAINT project_teams_pkey PRIMARY KEY (id), 
   CONSTRAINT project_teams_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id), 
   CONSTRAINT project_teams_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) 
 ); 
 CREATE TABLE public.projects ( 
   name text NOT NULL, 
   description text, 
   start_date date, 
   end_date date, 
   department text, 
   project_manager_id uuid, 
   business_unit_id uuid, 
   team_id uuid, 
   id uuid NOT NULL DEFAULT gen_random_uuid(), 
   status text DEFAULT 'planning'::text, 
   total_budget numeric DEFAULT 0, 
   allocated_budget numeric DEFAULT 0, 
   spent_budget numeric DEFAULT 0, 
   created_at timestamp with time zone DEFAULT now(), 
   updated_at timestamp with time zone DEFAULT now(), 
   CONSTRAINT projects_pkey PRIMARY KEY (id), 
   CONSTRAINT projects_project_manager_id_fkey FOREIGN KEY (project_manager_id) REFERENCES auth.users(id), 
   CONSTRAINT projects_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.business_units(id), 
   CONSTRAINT projects_business_unit_id_fkey FOREIGN KEY (business_unit_id) REFERENCES public.business_units(id) 
 ); 
 CREATE TABLE public.user_roles ( 
   user_id uuid NOT NULL, 
   role USER-DEFINED NOT NULL, 
   assigned_by uuid, 
   id uuid NOT NULL DEFAULT gen_random_uuid(), 
   assigned_at timestamp with time zone NOT NULL DEFAULT now(), 
   CONSTRAINT user_roles_pkey PRIMARY KEY (id), 
   CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id), 
   CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id) 
 );