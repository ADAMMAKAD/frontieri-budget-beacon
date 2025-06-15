import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useRole } from '@/hooks/useRole';
import { Plus, Edit, Trash2, Building } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  total_budget: number;
  allocated_budget: number;
  spent_budget: number;
  start_date: string;
  end_date: string;
  department: string;
  team_id: string;
  project_manager_id: string;
  created_at: string;
}

interface BusinessUnit {
  id: string;
  name: string;
}

export const AdminProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [projectAdmins, setProjectAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    status: 'planning',
    total_budget: 0,
    department: '',
    start_date: '',
    end_date: '',
    team_id: '',
    project_manager_id: ''
  });
  const { toast } = useToast();
  const { isAdmin, canCreateProject, canAccessProject } = useRole();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get projects, business units, and project admins from Supabase
      const [{ data: projectsList, error: projectsError }, { data: businessUnitsList, error: buError }, { data: usersList, error: usersError }] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('business_units').select('*'),
        supabase.from('profiles').select('*')
      ]);

      if (projectsError) throw projectsError;
      if (buError) throw buError;
      if (usersError) throw usersError;

      let filteredProjects = projectsList || [];
      if (!isAdmin) {
        filteredProjects = filteredProjects.filter(project =>
          canAccessProject(project.team_id, project.project_manager_id)
        );
      }

      const projectAdminUsers = (usersList || []).filter(user =>
        user.role === 'project_admin' || user.role === 'admin'
      );

      setProjects(filteredProjects);
      setBusinessUnits(businessUnitsList || []);
      setProjectAdmins(projectAdminUsers);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProject = async () => {
    try {
      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editingProject.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Project updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('projects')
          .insert([projectData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Project created successfully and project admin assigned"
        });
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save project",
        variant: "destructive"
      });
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project deleted successfully"
      });

      fetchData();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete project",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setProjectData({
      name: project.name,
      description: project.description || '',
      status: project.status || 'planning',
      total_budget: project.total_budget || 0,
      department: project.department || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      team_id: project.team_id || '',
      project_manager_id: project.project_manager_id || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProject(null);
    setProjectData({
      name: '',
      description: '',
      status: 'planning',
      total_budget: 0,
      department: '',
      start_date: '',
      end_date: '',
      team_id: '',
      project_manager_id: ''
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if user has permission to manage projects
  if (!canCreateProject() && !isAdmin) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">You don't have permission to create projects. Only admins can create projects and assign project administrators.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Management</h2>
          <p className="text-gray-600">Create projects and assign project administrators</p>
        </div>
        {canCreateProject() && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </DialogTitle>
                <DialogDescription>
                  {editingProject ? 'Update project details' : 'Create a new project and assign a project administrator'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={projectData.name}
                    onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={projectData.description}
                    onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={projectData.status} onValueChange={(value) => setProjectData({ ...projectData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on-hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={projectData.department}
                      onChange={(e) => setProjectData({ ...projectData, department: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="team_id">Business Unit</Label>
                  <Select value={projectData.team_id} onValueChange={(value) => setProjectData({ ...projectData, team_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select business unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="total_budget">Total Budget</Label>
                  <Input
                    id="total_budget"
                    type="number"
                    value={projectData.total_budget}
                    onChange={(e) => setProjectData({ ...projectData, total_budget: Number(e.target.value) })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={projectData.start_date}
                      onChange={(e) => setProjectData({ ...projectData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={projectData.end_date}
                      onChange={(e) => setProjectData({ ...projectData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="project_manager_id">Project Administrator</Label>
                  <Select value={projectData.project_manager_id} onValueChange={(value) => setProjectData({ ...projectData, project_manager_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project administrator" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectAdmins.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.full_name} ({admin.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveProject}>
                  {editingProject ? 'Update' : 'Create'} Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isAdmin ? 'All Projects' : 'Your Team Projects'}
          </CardTitle>
          <CardDescription>
            {isAdmin ? 'View and manage all projects in the system' : 'Projects you have access to'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>{project.department || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(project.status)}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>${project.total_budget?.toLocaleString() || 0}</TableCell>
                  <TableCell>
                    {project.total_budget ? 
                      `${Math.round((project.spent_budget / project.total_budget) * 100)}%` : 
                      '0%'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(project)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteProject(project.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
