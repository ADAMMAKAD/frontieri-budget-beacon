
-- Add team_id to profiles table first
ALTER TABLE public.profiles ADD COLUMN team_id UUID REFERENCES public.business_units(id);

-- Add team_id to projects table to associate projects with specific teams/business units
ALTER TABLE public.projects ADD COLUMN team_id UUID REFERENCES public.business_units(id);

-- Create RLS policies for team-based project access
DROP POLICY IF EXISTS "Users can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete projects" ON public.projects;

-- Enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create function to get user's team/business unit (now that team_id column exists)
CREATE OR REPLACE FUNCTION public.get_user_team_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT team_id FROM public.profiles WHERE id = _user_id),
    (SELECT id FROM public.business_units WHERE manager_id = _user_id LIMIT 1)
  );
$$;

-- Create function to check if user is project admin
CREATE OR REPLACE FUNCTION public.is_project_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT public.has_role(_user_id, 'project_admin') OR public.has_role(_user_id, 'admin');
$$;

-- RLS policies for projects
CREATE POLICY "Users can view their team projects" 
  ON public.projects 
  FOR SELECT 
  USING (
    team_id = public.get_user_team_id(auth.uid()) OR 
    public.has_role(auth.uid(), 'admin') OR
    project_manager_id = auth.uid()
  );

CREATE POLICY "Project admins can create projects" 
  ON public.projects 
  FOR INSERT 
  WITH CHECK (public.is_project_admin(auth.uid()));

CREATE POLICY "Project managers and admins can update projects" 
  ON public.projects 
  FOR UPDATE 
  USING (
    project_manager_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin') OR
    (team_id = public.get_user_team_id(auth.uid()) AND public.is_project_admin(auth.uid()))
  );

CREATE POLICY "Project admins can delete projects" 
  ON public.projects 
  FOR DELETE 
  USING (
    public.has_role(auth.uid(), 'admin') OR
    (team_id = public.get_user_team_id(auth.uid()) AND public.is_project_admin(auth.uid()))
  );

-- Update budget_categories RLS policies for team access
DROP POLICY IF EXISTS "Users can view budget categories" ON public.budget_categories;
DROP POLICY IF EXISTS "Users can create budget categories" ON public.budget_categories;
DROP POLICY IF EXISTS "Users can update budget categories" ON public.budget_categories;
DROP POLICY IF EXISTS "Users can delete budget categories" ON public.budget_categories;

ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team budget categories" 
  ON public.budget_categories 
  FOR SELECT 
  USING (
    project_id IN (
      SELECT id FROM public.projects 
      WHERE team_id = public.get_user_team_id(auth.uid()) OR 
            project_manager_id = auth.uid() OR
            public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Team members can create budget categories" 
  ON public.budget_categories 
  FOR INSERT 
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects 
      WHERE team_id = public.get_user_team_id(auth.uid()) OR 
            project_manager_id = auth.uid() OR
            public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Team members can update budget categories" 
  ON public.budget_categories 
  FOR UPDATE 
  USING (
    project_id IN (
      SELECT id FROM public.projects 
      WHERE team_id = public.get_user_team_id(auth.uid()) OR 
            project_manager_id = auth.uid() OR
            public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Team members can delete budget categories" 
  ON public.budget_categories 
  FOR DELETE 
  USING (
    project_id IN (
      SELECT id FROM public.projects 
      WHERE team_id = public.get_user_team_id(auth.uid()) OR 
            project_manager_id = auth.uid() OR
            public.has_role(auth.uid(), 'admin')
    )
  );

-- Update expenses RLS policies for team access
DROP POLICY IF EXISTS "Users can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can create expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete expenses" ON public.expenses;

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team expenses" 
  ON public.expenses 
  FOR SELECT 
  USING (
    project_id IN (
      SELECT id FROM public.projects 
      WHERE team_id = public.get_user_team_id(auth.uid()) OR 
            project_manager_id = auth.uid() OR
            public.has_role(auth.uid(), 'admin')
    ) OR submitted_by = auth.uid()
  );

CREATE POLICY "Users can create expenses" 
  ON public.expenses 
  FOR INSERT 
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Users can update their expenses" 
  ON public.expenses 
  FOR UPDATE 
  USING (
    submitted_by = auth.uid() OR
    public.has_role(auth.uid(), 'admin') OR
    (project_id IN (
      SELECT id FROM public.projects 
      WHERE project_manager_id = auth.uid()
    ))
  );
