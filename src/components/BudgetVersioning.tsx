
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  GitBranch, Plus, Edit, FileText, Search, Filter, Eye, Download, 
  Grid3X3, List, Clock, CheckCircle, XCircle, AlertCircle,
  TrendingUp, TrendingDown, BarChart3, Users, Calendar,
  GitCompare, History, Archive, Star, Copy, Share2
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

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
  budget_data?: any;
  change_summary?: string;
  approval_notes?: string;
}

interface Project {
  id: string;
  name: string;
  total_budget?: number;
  department?: string;
}

type ViewMode = 'grid' | 'list' | 'timeline';
type SortOption = 'version' | 'title' | 'status' | 'created' | 'approved';

const BudgetVersioning = () => {
  const [budgetVersions, setBudgetVersions] = useState<BudgetVersion[]>([]);
  const [filteredVersions, setFilteredVersions] = useState<BudgetVersion[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<BudgetVersion | null>(null);
  const [compareVersions, setCompareVersions] = useState<BudgetVersion[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('version');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    status: 'draft',
    change_summary: '',
    budget_data: {}
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAndSortVersions();
  }, [budgetVersions, searchTerm, statusFilter, projectFilter, sortBy, sortOrder]);

  const fetchData = async () => {
    try {
      const [versionsResponse, projectsResponse] = await Promise.all([
        apiClient.request('/budget-versions?order=created_at:desc'),
        apiClient.getProjects()
      ]);

      if (versionsResponse.error) throw new Error(versionsResponse.error);
      if (projectsResponse.error) throw new Error(projectsResponse.error);

      setBudgetVersions(versionsResponse.data || []);
      setProjects(projectsResponse.projects || []);
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

  const filterAndSortVersions = () => {
    let filtered = budgetVersions.filter(version => {
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

    // Sort versions
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'version':
          aValue = a.version_number;
          bValue = b.version_number;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'created':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'approved':
          aValue = a.approved_at ? new Date(a.approved_at).getTime() : 0;
          bValue = b.approved_at ? new Date(b.approved_at).getTime() : 0;
          break;
        default:
          aValue = a.version_number;
          bValue = b.version_number;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredVersions(filtered);
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
      const existingVersionsResponse = await apiClient.request(`/budget-versions?project_id=${formData.project_id}&order=version_number:desc&limit=1`);
      const existingVersions = existingVersionsResponse.data || [];

      const nextVersion = existingVersions.length > 0 
        ? existingVersions[0].version_number + 1 
        : 1;

      await apiClient.request('/budget-versions', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          version_number: nextVersion,
          created_by: user?.id
        })
      });

      toast({
        title: "Success",
        description: "Budget version created successfully"
      });

      setFormData({ 
        project_id: '', 
        title: '', 
        description: '', 
        status: 'draft',
        change_summary: '',
        budget_data: {}
      });
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

  const approveVersion = async (versionId: string, notes?: string) => {
    try {
      await apiClient.request(`/budget-versions/${versionId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          approval_notes: notes
        })
      });

      toast({
        title: "Success",
        description: "Version approved successfully"
      });

      fetchData();
    } catch (error: any) {
      console.error('Error approving version:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve version",
        variant: "destructive"
      });
    }
  };

  const rejectVersion = async (versionId: string, notes?: string) => {
    try {
      await apiClient.request(`/budget-versions/${versionId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          approval_notes: notes
        })
      });

      toast({
        title: "Success",
        description: "Version rejected"
      });

      fetchData();
    } catch (error: any) {
      console.error('Error rejecting version:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject version",
        variant: "destructive"
      });
    }
  };

  const duplicateVersion = async (version: BudgetVersion) => {
    try {
      const existingVersionsResponse = await apiClient.request(`/budget-versions?project_id=${version.project_id}&order=version_number:desc&limit=1`);
      const existingVersions = existingVersionsResponse.data || [];

      const nextVersion = existingVersions.length > 0 
        ? existingVersions[0].version_number + 1 
        : 1;

      await apiClient.request('/budget-versions', {
        method: 'POST',
        body: JSON.stringify({
          project_id: version.project_id,
          title: `${version.title} (Copy)`,
          description: version.description,
          status: 'draft',
          version_number: nextVersion,
          created_by: user?.id,
          budget_data: version.budget_data,
          change_summary: 'Duplicated from v' + version.version_number
        })
      });

      toast({
        title: "Success",
        description: "Version duplicated successfully"
      });

      fetchData();
    } catch (error: any) {
      console.error('Error duplicating version:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to duplicate version",
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'draft': return <Edit className="h-4 w-4 text-gray-600" />;
      default: return <Edit className="h-4 w-4 text-gray-600" />;
    }
  };

  const getVersionStats = () => {
    const total = budgetVersions.length;
    const approved = budgetVersions.filter(v => v.status === 'approved').length;
    const pending = budgetVersions.filter(v => v.status === 'pending').length;
    const draft = budgetVersions.filter(v => v.status === 'draft').length;
    const rejected = budgetVersions.filter(v => v.status === 'rejected').length;

    return { total, approved, pending, draft, rejected };
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setProjectFilter('all');
  };

  // Version Detail Modal Component
  const VersionDetailModal = ({ version }: { version: BudgetVersion }) => {
    const project = projects.find(p => p.id === version.project_id);
    const stats = getVersionStats();
    
    return (
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="h-6 w-6" />
            {version.title} (v{version.version_number})
            <Badge className={getStatusColor(version.status)}>
              {getStatusIcon(version.status)}
              {version.status}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-lg">
            {project?.name} • Created {new Date(version.created_at).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="budget">Budget Data</TabsTrigger>
            <TabsTrigger value="changes">Changes</TabsTrigger>
            <TabsTrigger value="approval">Approval</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">Version Info</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div><strong>Version:</strong> v{version.version_number}</div>
                    <div><strong>Project:</strong> {project?.name}</div>
                    <div><strong>Department:</strong> {project?.department || 'N/A'}</div>
                    <div><strong>Created:</strong> {new Date(version.created_at).toLocaleString()}</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold">Status</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(version.status)}
                      <span className="capitalize">{version.status}</span>
                    </div>
                    {version.approved_at && (
                      <div className="text-sm text-gray-600">
                        Approved: {new Date(version.approved_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {version.description && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-700">{version.description}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="budget" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Budget Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Total Budget:</span>
                    <span className="font-semibold">${project?.total_budget?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <Separator />
                  <div className="text-sm text-gray-600">
                    Budget data structure and allocations would be displayed here based on the actual budget_data field.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="changes" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Change Summary</h3>
                {version.change_summary ? (
                  <p className="text-gray-700">{version.change_summary}</p>
                ) : (
                  <p className="text-gray-500 italic">No change summary provided</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="approval" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Approval Workflow</h3>
                <div className="space-y-4">
                  {version.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => approveVersion(version.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        onClick={() => rejectVersion(version.id)}
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                  
                  {version.approval_notes && (
                    <div>
                      <h4 className="font-medium mb-2">Approval Notes:</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded">{version.approval_notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => duplicateVersion(version)}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
          <Button variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </DialogContent>
    );
  };

  // Grid View Component
  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredVersions.map((version) => {
        const project = projects.find(p => p.id === version.project_id);
        return (
          <Card key={version.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">v{version.version_number}</CardTitle>
                </div>
                <Badge className={getStatusColor(version.status)}>
                  {getStatusIcon(version.status)}
                  {version.status}
                </Badge>
              </div>
              <CardDescription className="font-medium">{version.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{project?.name || 'Unknown Project'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{new Date(version.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              {version.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{version.description}</p>
              )}
              
              <div className="flex justify-between items-center pt-2">
                <div className="flex gap-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedVersion(version)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    {selectedVersion && <VersionDetailModal version={selectedVersion} />}
                  </Dialog>
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => duplicateVersion(version)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                {version.status === 'pending' && (
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      onClick={() => approveVersion(version.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => rejectVersion(version.id)}
                      variant="destructive"
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // List View Component
  const ListView = () => (
    <Card>
      <CardContent className="p-0">
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
                <TableRow key={version.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-blue-600" />
                      v{version.version_number}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{version.title}</TableCell>
                  <TableCell>{project?.name || 'Unknown Project'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(version.status)}>
                      {getStatusIcon(version.status)}
                      {version.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(version.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {version.approved_at ? new Date(version.approved_at).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedVersion(version)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        {selectedVersion && <VersionDetailModal version={selectedVersion} />}
                      </Dialog>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => duplicateVersion(version)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  // Timeline View Component
  const TimelineView = () => (
    <div className="space-y-6">
      {filteredVersions.map((version, index) => {
        const project = projects.find(p => p.id === version.project_id);
        const isLast = index === filteredVersions.length - 1;
        
        return (
          <div key={version.id} className="relative">
            {!isLast && (
              <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200"></div>
            )}
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                version.status === 'approved' ? 'bg-green-100' :
                version.status === 'rejected' ? 'bg-red-100' :
                version.status === 'pending' ? 'bg-yellow-100' : 'bg-gray-100'
              }`}>
                {getStatusIcon(version.status)}
              </div>
              
              <Card className="flex-1">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{version.title}</h3>
                      <Badge className={getStatusColor(version.status)}>
                        v{version.version_number}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedVersion(version)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        {selectedVersion && <VersionDetailModal version={selectedVersion} />}
                      </Dialog>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    {project?.name} • {new Date(version.created_at).toLocaleDateString()}
                  </div>
                  
                  {version.description && (
                    <p className="text-sm text-gray-700">{version.description}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );
      })}
    </div>
  );

  const stats = getVersionStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Budget Versioning</h2>
          <p className="text-gray-600 mt-1">Track and manage budget version history with advanced analytics</p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Version
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Versions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search versions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Project Filter */}
            <div>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Project" />
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
            </div>
            
            {/* Sort By */}
            <div>
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="version">Version</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('timeline')}
              >
                <History className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
          
          {/* Clear Filters */}
          {(searchTerm || statusFilter !== 'all' || projectFilter !== 'all') && (
            <div className="mt-4 flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <Filter className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
              <span className="text-sm text-gray-600">
                Showing {filteredVersions.length} of {budgetVersions.length} versions
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Version Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GitBranch className="h-5 w-5" />
              <span>Create Budget Version</span>
            </CardTitle>
            <CardDescription>Create a new version of your budget with detailed tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project">Project *</Label>
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
                <Label htmlFor="title">Version Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Q1 2024 Budget Revision"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the purpose and changes in this version..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="changeSummary">Change Summary</Label>
              <Textarea
                id="changeSummary"
                value={formData.change_summary}
                onChange={(e) => setFormData(prev => ({ ...prev, change_summary: e.target.value }))}
                placeholder="Summarize the key changes made in this version..."
                rows={2}
              />
            </div>

            <div className="flex space-x-2">
              <Button onClick={createVersion} className="bg-gradient-to-r from-blue-600 to-purple-600">
                Create Version
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Versions Display */}
      {viewMode === 'grid' && <GridView />}
      {viewMode === 'list' && <ListView />}
      {viewMode === 'timeline' && <TimelineView />}

      {/* Empty State */}
      {filteredVersions.length === 0 && (
        <div className="text-center py-12">
          <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all' || projectFilter !== 'all' 
              ? 'No matching versions' 
              : 'No budget versions found'
            }
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all' || projectFilter !== 'all'
              ? 'Try adjusting your search criteria'
              : 'Create your first budget version to get started'
            }
          </p>
          {budgetVersions.length === 0 && (
            <Button 
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Version
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default BudgetVersioning;
