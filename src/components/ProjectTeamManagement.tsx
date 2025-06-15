import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, Trash2, UserPlus, Search } from 'lucide-react';

interface TeamMember {
  id: string;
  user_id: string;
  project_id: string;
  role: string;
  created_at: string;
  profiles?: {
    full_name: string;
    department: string;
  } | null;
  projects?: {
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
  department: string;
}

const ProjectTeamManagement = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [newMember, setNewMember] = useState({
    user_id: '',
    project_id: '',
    role: 'member'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [teamMembers, searchTerm, projectFilter, roleFilter]);

  const filterMembers = () => {
    let filtered = teamMembers;

    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.profiles?.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.projects?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (projectFilter !== 'all') {
      filtered = filtered.filter(member => member.project_id === projectFilter);
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(member => member.role === roleFilter);
    }

    setFilteredMembers(filtered);
  };

  const fetchData = async () => {
    await Promise.all([fetchTeamMembers(), fetchProjects(), fetchProfiles()]);
  };

  const fetchTeamMembers = async () => {
    try {
      console.log('🔍 Fetching team members...');
      
      // First, let's try the simplest possible query
      const { data: teamData, error: teamError } = await supabase
        .from('project_teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (teamError) {
        console.error('❌ Error fetching team members:', teamError);
        console.error('❌ Full team error details:', JSON.stringify(teamError, null, 2));
        toast({
          title: "Error",
          description: `Failed to fetch team members: ${teamError.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Team data fetched:', teamData);

      // Fetch profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, department');

      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError);
        console.error('❌ Full profiles error details:', JSON.stringify(profilesError, null, 2));
      } else {
        console.log('✅ Profiles data fetched:', profilesData);
      }

      // Fetch projects separately
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name');

      if (projectsError) {
        console.error('❌ Error fetching projects:', projectsError);
        console.error('❌ Full projects error details:', JSON.stringify(projectsError, null, 2));
      } else {
        console.log('✅ Projects data fetched:', projectsData);
      }

      // Manually join the data
      const enrichedTeamMembers = teamData?.map(member => ({
        ...member,
        profiles: profilesData?.find(profile => profile.id === member.user_id) || null,
        projects: projectsData?.find(project => project.id === member.project_id) || null
      })) || [];

      console.log('✅ Enriched team members:', enrichedTeamMembers);
      setTeamMembers(enrichedTeamMembers);
    } catch (error) {
      console.error('💥 Unexpected error in fetchTeamMembers:', error);
      toast({
        title: "Error",
        description: "Unexpected error while fetching team members",
        variant: "destructive"
      });
    }
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name')
      .order('name');

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

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, department')
      .order('full_name');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch profiles",
        variant: "destructive"
      });
    } else {
      setProfiles(data || []);
    }
  };

  const addTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if member already exists in this project
    const existingMember = teamMembers.find(
      member => member.user_id === newMember.user_id && member.project_id === newMember.project_id
    );

    if (existingMember) {
      toast({
        title: "Error",
        description: "This user is already a member of this project",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('project_teams')
      .insert([newMember]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add team member",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Team member added successfully"
      });
      setIsCreating(false);
      setNewMember({
        user_id: '',
        project_id: '',
        role: 'member'
      });
      fetchTeamMembers();
    }
  };

  const removeTeamMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    const { error } = await supabase
      .from('project_teams')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Team member removed successfully"
      });
      fetchTeamMembers();
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'lead': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'member': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Team Management</h2>
          <p className="text-gray-600 mt-1">Manage team members across projects</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-green-600 to-blue-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Assign a user to a project team
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={addTeamMember} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select 
                  value={newMember.project_id} 
                  onValueChange={(value) => setNewMember(prev => ({ ...prev, project_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.filter(project => project.id && project.id.trim() !== '').map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user">Team Member</Label>
                <Select 
                  value={newMember.user_id} 
                  onValueChange={(value) => setNewMember(prev => ({ ...prev, user_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.filter(profile => profile.id && profile.id.trim() !== '').map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name || 'Unknown'} ({profile.department || 'No department'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={newMember.role} 
                  onValueChange={(value) => setNewMember(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-green-600 to-blue-600">
                  Add Member
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name, department, or project..."
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
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  {member.profiles?.full_name || 'Unknown User'}
                </CardTitle>
                <Badge className={getRoleColor(member.role)}>
                  {member.role}
                </Badge>
              </div>
              <CardDescription>
                {member.projects?.name || 'Unknown Project'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <p><strong>Department:</strong> {member.profiles?.department || 'Not specified'}</p>
                <p><strong>Added:</strong> {new Date(member.created_at).toLocaleDateString()}</p>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeTeamMember(member.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && !isCreating && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || projectFilter !== 'all' || roleFilter !== 'all' ? 'No matching team members' : 'No team members yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || projectFilter !== 'all' || roleFilter !== 'all'
              ? 'Try adjusting your search criteria'
              : 'Add team members to get started'
            }
          </p>
          {!searchTerm && projectFilter === 'all' && roleFilter === 'all' && (
            <Button 
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-green-600 to-blue-600"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Team Member
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectTeamManagement;
