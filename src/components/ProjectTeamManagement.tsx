
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
import { Users, Plus, Trash2, UserPlus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ProjectTeam {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  created_at: string;
  projects?: { name: string };
  profiles?: { full_name: string };
}

interface Project {
  id: string;
  name: string;
}

const ProjectTeamManagement = () => {
  const [teams, setTeams] = useState<ProjectTeam[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    user_email: '',
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
      const [teamsResult, projectsResult] = await Promise.all([
        supabase
          .from('project_teams')
          .select(`
            *,
            projects(name),
            profiles(full_name)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('projects')
          .select('id, name, team_id, project_manager_id')
          .order('name')
      ]);

      if (teamsResult.error) throw teamsResult.error;
      if (projectsResult.error) throw projectsResult.error;

      // Filter projects based on user access
      const accessibleProjects = (projectsResult.data || []).filter(project => 
        canAccessProject(project.team_id, project.project_manager_id)
      );

      setTeams(teamsResult.data || []);
      setProjects(accessibleProjects);
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
      // Look up user by email in auth.users via RPC call or use profiles table
      // Since we can't query auth.users directly, we'll try to find by email in profiles
      // This assumes the full_name field might contain the email or we need a different approach
      
      // For now, let's assume the user_email input is actually a user ID
      // In a real implementation, you'd want to have a proper user lookup system
      const { error } = await supabase
        .from('project_teams')
        .insert([{
          project_id: formData.project_id,
          user_id: formData.user_email, // This should be a proper user ID lookup
          role: formData.role
        }]);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Team member added successfully"
      });

      setFormData({ project_id: '', user_email: '', role: 'member' });
      setIsAdding(false);
      fetchData();
    } catch (error) {
      console.error('Error adding team member:', error);
      toast({
        title: "Error",
        description: "Failed to add team member. Please ensure the user ID is valid.",
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
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select
                    value={formData.project_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_email">User ID</Label>
                  <Input
                    id="user_email"
                    value={formData.user_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, user_email: e.target.value }))}
                    placeholder="Enter user ID"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the UUID of the user you want to add
                  </p>
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
                    setFormData({ project_id: '', user_email: '', role: 'member' });
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
            <span>Project Teams</span>
          </CardTitle>
          <CardDescription>Current project team assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Added</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>{team.projects?.name || team.project_id}</TableCell>
                  <TableCell>{team.profiles?.full_name || team.user_id}</TableCell>
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectTeamManagement;
