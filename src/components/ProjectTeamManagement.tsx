
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Users, Search, UserMinus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TeamMember {
  id: string;
  user_id: string;
  project_id: string;
  role: string;
  created_at: string;
  profiles: {
    full_name: string;
    department: string;
  } | null;
  projects: {
    name: string;
  } | null;
}

interface Project {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  department: string;
}

const ProjectTeamManagement = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newMember, setNewMember] = useState({
    project_id: '',
    user_id: '',
    role: 'member'
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch team members, projects, and profiles
      const [teamData, projectsData, profilesData] = await Promise.all([
        apiClient.request('/project-teams'),
        apiClient.getProjects(),
        apiClient.request('/auth/users')
      ]);

      setTeamMembers(teamData || []);
      setProjects(projectsData || []);
      setProfiles(profilesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load team data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTeamMember = async () => {
    try {
      if (!newMember.project_id || !newMember.user_id) {
        toast({
          title: "Error",
          description: "Please select both project and user",
          variant: "destructive"
        });
        return;
      }

      await apiClient.request('/project-teams', {
        method: 'POST',
        body: JSON.stringify(newMember)
      });

      toast({
        title: "Success",
        description: "Team member added successfully"
      });

      setIsAdding(false);
      setNewMember({ project_id: '', user_id: '', role: 'member' });
      fetchData();
    } catch (error: any) {
      console.error('Error adding team member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add team member",
        variant: "destructive"
      });
    }
  };

  const removeTeamMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      await apiClient.request(`/project-teams/${id}`, {
        method: 'DELETE'
      });

      toast({
        title: "Success",
        description: "Team member removed successfully"
      });

      fetchData();
    } catch (error: any) {
      console.error('Error removing team member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove team member",
        variant: "destructive"
      });
    }
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = 
      member.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.projects?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProject = projectFilter === 'all' || member.project_id === projectFilter;
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;

    return matchesSearch && matchesProject && matchesRole;
  });

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
          <p className="text-gray-600 mt-1">Manage team members across projects</p>
        </div>
        <Button 
          onClick={() => setIsAdding(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name, project, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Add Team Member</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select value={newMember.project_id} onValueChange={(value) => setNewMember(prev => ({ ...prev, project_id: value }))}>
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
                <Label htmlFor="user">User</Label>
                <Select value={newMember.user_id} onValueChange={(value) => setNewMember(prev => ({ ...prev, user_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name} - {profile.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newMember.role} onValueChange={(value) => setNewMember(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
              <Button onClick={addTeamMember}>Add Member</Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Team Members</span>
          </CardTitle>
          <CardDescription>
            Manage project team assignments ({filteredMembers.length} of {teamMembers.length} members)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Added</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.profiles?.full_name || 'Unknown User'}
                  </TableCell>
                  <TableCell>{member.projects?.name || 'Unknown Project'}</TableCell>
                  <TableCell>{member.profiles?.department || 'Unknown'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      member.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                      member.role === 'member' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {member.role}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeTeamMember(member.id)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredMembers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || projectFilter !== 'all' || roleFilter !== 'all' 
                  ? 'No matching team members' 
                  : 'No team members found'
                }
              </h3>
              <p className="text-gray-600">
                {searchTerm || projectFilter !== 'all' || roleFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'Add team members to get started'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectTeamManagement;
