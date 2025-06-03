
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar, DollarSign, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  allocated_budget: number;
  spent_budget: number;
  department: string;
}

const BudgetPlanning = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    total_budget: '',
    department: ''
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive"
      });
    } else {
      setProjects(data || []);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('projects')
      .insert([{
        ...newProject,
        total_budget: parseFloat(newProject.total_budget),
        project_manager_id: user?.id
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Project created successfully"
      });
      setIsCreating(false);
      setNewProject({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        total_budget: '',
        department: ''
      });
      fetchProjects();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on-hold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Budget Planning</h2>
          <p className="text-gray-600 mt-1">Create and manage project budgets</p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
            <CardDescription>Set up a new project with budget planning</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createProject} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    value={newProject.name}
                    onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={newProject.department}
                    onChange={(e) => setNewProject(prev => ({ ...prev, department: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newProject.start_date}
                    onChange={(e) => setNewProject(prev => ({ ...prev, start_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newProject.end_date}
                    onChange={(e) => setNewProject(prev => ({ ...prev, end_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalBudget">Total Budget</Label>
                  <Input
                    id="totalBudget"
                    type="number"
                    step="0.01"
                    value={newProject.total_budget}
                    onChange={(e) => setNewProject(prev => ({ ...prev, total_budget: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600">
                  Create Project
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <Badge className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
              </div>
              <CardDescription>{project.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <DollarSign className="h-4 w-4" />
                <span>Budget: ${project.total_budget?.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{project.department}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full" 
                  style={{ 
                    width: `${project.total_budget > 0 ? (project.spent_budget / project.total_budget) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500">
                Spent: ${project.spent_budget?.toLocaleString()} of ${project.total_budget?.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {projects.length === 0 && !isCreating && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-4">Create your first project to start budget planning</p>
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </div>
      )}
    </div>
  );
};

export default BudgetPlanning;
