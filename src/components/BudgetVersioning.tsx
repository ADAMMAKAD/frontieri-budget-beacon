
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
import { GitBranch, Plus, Edit, FileText, Search, Filter } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface BudgetVersion {
  id: string;
  project_id: string | null;
  version_number: number;
  title: string;
  description: string | null;
  status: string;
  created_by: string | null;
  approved_by: string | null;
  created_at: string;
  approved_at: string | null;
}

const BudgetVersioning = () => {
  const [budgetVersions, setBudgetVersions] = useState<BudgetVersion[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    status: 'draft'
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [versionsResult, projectsResult] = await Promise.all([
        supabase.from('budget_versions').select('*').order('created_at', { ascending: false }),
        supabase.from('projects').select('id, name')
      ]);

      if (versionsResult.error) throw versionsResult.error;
      if (projectsResult.error) throw projectsResult.error;

      setBudgetVersions(versionsResult.data || []);
      setProjects(projectsResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load budget versions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createVersion = async () => {
    try {
      if (!formData.project_id || !formData.title) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      // Get the next version number for this project
      const { data: existingVersions } = await supabase
        .from('budget_versions')
        .select('version_number')
        .eq('project_id', formData.project_id)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVersion = existingVersions && existingVersions.length > 0 
        ? existingVersions[0].version_number + 1 
        : 1;

      const { error } = await supabase
        .from('budget_versions')
        .insert([{
          ...formData,
          version_number: nextVersion,
          created_by: user?.id
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Budget version created successfully"
      });

      setFormData({ project_id: '', title: '', description: '', status: 'draft' });
      setIsCreating(false);
      fetchData();
    } catch (error: any) {
      console.error('Error creating version:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create budget version",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredVersions = budgetVersions.filter(version => {
    const project = projects.find(p => p.id === version.project_id);
    const projectName = project?.name || '';
    
    const matchesSearch = 
      version.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      version.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projectName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || version.status === statusFilter;
    const matchesProject = projectFilter === 'all' || version.project_id === projectFilter;

    return matchesSearch && matchesStatus && matchesProject;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setProjectFilter('all');
  };

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
          <h2 className="text-2xl font-bold text-gray-900">Budget Versioning</h2>
          <p className="text-gray-600 mt-1">Track and manage budget version history</p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Version
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by title, description, or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
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
        {(searchTerm || statusFilter !== 'all' || projectFilter !== 'all') && (
          <Button variant="outline" onClick={clearFilters}>
            <Filter className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GitBranch className="h-5 w-5" />
              <span>Create Budget Version</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select value={formData.project_id} onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}>
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
                <Label htmlFor="title">Version Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Q1 2024 Budget"
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
              <Button onClick={createVersion}>Create Version</Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GitBranch className="h-5 w-5" />
            <span>Budget Versions</span>
          </CardTitle>
          <CardDescription>
            Track budget changes over time ({filteredVersions.length} of {budgetVersions.length} versions)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVersions.map((version) => {
                const project = projects.find(p => p.id === version.project_id);
                return (
                  <TableRow key={version.id}>
                    <TableCell className="font-medium">
                      v{version.version_number}
                    </TableCell>
                    <TableCell>{version.title}</TableCell>
                    <TableCell>{project?.name || 'Unknown Project'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(version.status)}>
                        {version.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(version.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {version.approved_at ? new Date(version.approved_at).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredVersions.length === 0 && (
            <div className="text-center py-8">
              <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' || projectFilter !== 'all' 
                  ? 'No matching versions' 
                  : 'No budget versions found'
                }
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || projectFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'Create your first budget version to get started'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetVersioning;
