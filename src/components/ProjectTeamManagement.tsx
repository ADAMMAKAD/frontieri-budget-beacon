import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Users, Plus, Trash2, UserPlus, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProjectDetailsModal } from '@/components/ProjectDetailsModal';

interface ProjectTeam {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  created_at: string;
  projects?: { name: string };
  profiles?: { full_name: string | null };
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  total_budget: number;
  spent_budget: number;
  allocated_budget?: number;
  start_date?: string;
  end_date?: string;
  department?: string;
  team_id?: string;
  project_manager_id?: string;
  created_at: string;
}

const ProjectTeamManagement = () => {
  const [teams, setTeams] = useState<ProjectTeam[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [availableUsers, setAvailableUsers] = useState<{id: string, full_name: string | null}[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    user_id: '',
    role: 'member'
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin, isProjectAdmin, canAccessProject } = useRole();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('Fetching project teams data...');
      
      // Fetch teams with proper joins
      const { data: teamsData, error: teamsError } = await supabase
        .from('project_teams')
        .select(`
          id,
          project_id,
          user_id,
          role,
          created_at,
          projects!inner(name),
          profiles!inner(full_name)
        `)
        .order('created_at', { ascending: false });

      if (teamsError) {
        console.error('Teams query error:', teamsError);
        throw teamsError;
      }

      console.log('Teams data fetched:', teamsData);

      // Fetch projects for access control
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('name');

      if (projectsError) {
        console.error('Projects query error:', projectsError);
        throw projectsError;
      }

      // Fetch user profiles for dropdown
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');

      if (profilesError) {
        console.error('Profiles query error:', profilesError);
        throw profilesError;
      }

      // Filter projects based on user access
      const accessibleProjects = projectsData?.filter(project => 
        canAccessProject(project.team_id, project.project_manager_id)
      ) || [];

      setTeams(teamsData || []);
      setProjects(accessibleProjects);
      setAllProjects(projectsData || []);
      setAvailableUsers(profilesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('project_teams')
        .insert([{
          project_id: formData.project_id,
          user_id: formData.user_id,
          role: formData.role
        }]);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Team member added successfully"
      });

      setFormData({ project_id: '', user_id: '', role: 'member' });
      setIsAdding(false);
      fetchData();
    } catch (error) {
      console.error('Error adding team member:', error);
      toast({
        title: "Error",
        description: "Failed to add team member",
        variant: "destructive"
      });
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      const { error } = await supabase
        .from('project_teams')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Team member removed successfully"
      });
      
      fetchData();
    } catch (error) {
      console.error('Error removing team member:', error);
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive"
      });
    }
  };

  const getProject = (projectId: string) => {
    return allProjects.find(p => p.id === projectId);
  };

  const handleViewProject = (projectId: string) => {
    const project = getProject(projectId);
    if (project) {
      setSelectedProject(project);
      setProjectModalOpen(true);
    }
  };

  // Check if user has permission to manage teams
  if (!isAdmin && !isProjectAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">You don't have permission to manage project teams.</p>
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Team Management</h2>
          <p className="text-gray-600 mt-1">Manage project team members and roles</p>
        </div>
        <Button 
          onClick={() => setIsAdding(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5" />
              <span>Add Team Member</span>
            </CardTitle>
            <CardDescription>Assign team members to projects</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Project *</Label>
                  <Select
                    value={formData.project_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {allProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_id">Team Member *</Label>
                  <Select
                    value={formData.user_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, user_id: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || 'Unnamed User'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      {isAdmin && <SelectItem value="project_admin">Project Admin</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button type="submit">Add Member</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAdding(false);
                    setFormData({ project_id: '', user_id: '', role: 'member' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Current Project Team Assignments</span>
          </CardTitle>
          <CardDescription>Active team member assignments across projects</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Team Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <span>{team.projects?.name || team.project_id}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewProject(team.project_id)}
                        className="h-6 w-6 p-0"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{team.profiles?.full_name || 'Unnamed User'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      team.role === 'admin' ? 'bg-red-100 text-red-800' :
                      team.role === 'project_admin' ? 'bg-purple-100 text-purple-800' :
                      team.role === 'lead' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {team.role}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(team.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemove(team.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {teams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No team assignments found. Add some team members to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ProjectDetailsModal
        project={selectedProject}
        isOpen={projectModalOpen}
        onClose={() => {
          setProjectModalOpen(false);
          setSelectedProject(null);
        }}
      />
    </div>
  );
};

export default ProjectTeamManagement;
