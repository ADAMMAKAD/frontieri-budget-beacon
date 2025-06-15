
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Plus, Eye, CheckCircle, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProjectDetailsModal } from '@/components/ProjectDetailsModal';

interface BudgetVersion {
  id: string;
  project_id: string;
  version_number: number;
  title: string;
  description: string | null;
  status: string;
  created_by: string | null;
  approved_by: string | null;
  created_at: string;
  approved_at: string | null;
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

const BudgetVersioning = () => {
  const [versions, setVersions] = useState<BudgetVersion[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) {
      console.error('No user found');
      return;
    }

    try {
      const [versionsResult, projectsResult] = await Promise.all([
        supabase.from('budget_versions').select('*').order('created_at', { ascending: false }),
        supabase.from('projects').select('*').order('name')
      ]);

      if (versionsResult.error) throw versionsResult.error;
      if (projectsResult.error) throw projectsResult.error;

      setVersions(versionsResult.data || []);
      setProjects(projectsResult.data || []);
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
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create versions",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { data: existingVersions, error: versionError } = await supabase
        .from('budget_versions')
        .select('version_number')
        .eq('project_id', formData.project_id)
        .order('version_number', { ascending: false })
        .limit(1);

      if (versionError) throw versionError;

      const nextVersionNumber = existingVersions && existingVersions.length > 0 
        ? existingVersions[0].version_number + 1 
        : 1;

      const { error } = await supabase
        .from('budget_versions')
        .insert([{
          project_id: formData.project_id,
          version_number: nextVersionNumber,
          title: formData.title,
          description: formData.description,
          status: 'draft',
          created_by: user?.id
        }]);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Budget version created successfully"
      });

      setFormData({ project_id: '', title: '', description: '' });
      setIsCreating(false);
      fetchData();
    } catch (error) {
      console.error('Error creating budget version:', error);
      toast({
        title: "Error",
        description: "Failed to create budget version",
        variant: "destructive"
      });
    }
  };

  const handleApprove = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('budget_versions')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Budget version approved successfully"
      });
      
      fetchData();
    } catch (error) {
      console.error('Error approving budget version:', error);
      toast({
        title: "Error",
        description: "Failed to approve budget version",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('budget_versions')
        .update({
          status: 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Budget version rejected"
      });
      
      fetchData();
    } catch (error) {
      console.error('Error rejecting budget version:', error);
      toast({
        title: "Error",
        description: "Failed to reject budget version",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || projectId;
  };

  const getProject = (projectId: string) => {
    return projects.find(p => p.id === projectId);
  };

  const handleViewProject = (projectId: string) => {
    const project = getProject(projectId);
    if (project) {
      setSelectedProject(project);
      setProjectModalOpen(true);
    }
  };

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Show error if no user
  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access budget versioning.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Budget Versioning</h2>
          <p className="text-gray-600 mt-1">Create and manage budget versions</p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Version
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Create Budget Version</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      {projects.filter(project => project.id && project.id.trim() !== '').map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Version Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Q1 2025 Budget"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the changes in this version..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">Create Version</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreating(false);
                    setFormData({ project_id: '', title: '', description: '' });
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
            <FileText className="h-5 w-5" />
            <span>Budget Versions</span>
          </CardTitle>
          <CardDescription>Manage budget versions and approvals</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell className="font-medium">
                    {getProjectName(version.project_id)}
                  </TableCell>
                  <TableCell>v{version.version_number}</TableCell>
                  <TableCell className="font-medium">{version.title}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(version.status)}`}>
                      {version.status}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(version.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewProject(version.project_id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {version.status === 'draft' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(version.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(version.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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

export default BudgetVersioning;
