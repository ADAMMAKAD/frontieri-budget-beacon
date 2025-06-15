
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { GitBranch, Clock, CheckCircle, Search, Filter } from 'lucide-react';

interface BudgetVersion {
  id: string;
  project_id: string;
  title: string;
  version_number: number;
  status: string;
  created_by: string;
  created_at: string;
  approved_at?: string;
  projects?: {
    name: string;
  };
}

const BudgetVersioning = () => {
  const [versions, setVersions] = useState<BudgetVersion[]>([]);
  const [filteredVersions, setFilteredVersions] = useState<BudgetVersion[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterVersions();
  }, [versions, searchTerm, statusFilter, projectFilter]);

  const filterVersions = () => {
    let filtered = versions;

    if (searchTerm) {
      filtered = filtered.filter(version =>
        version.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        version.projects?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(version => version.status === statusFilter);
    }

    if (projectFilter !== 'all') {
      filtered = filtered.filter(version => version.project_id === projectFilter);
    }

    setFilteredVersions(filtered);
  };

  const fetchData = async () => {
    try {
      const [versionsResult, projectsResult] = await Promise.all([
        supabase
          .from('budget_versions')
          .select(`
            *,
            projects (name)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('projects')
          .select('id, name')
          .order('name')
      ]);

      if (versionsResult.error) throw versionsResult.error;
      if (projectsResult.error) throw projectsResult.error;

      setVersions(versionsResult.data || []);
      setProjects(projectsResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch budget versions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const approveVersion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('budget_versions')
        .update({ 
          status: 'approved',
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
      console.error('Error approving version:', error);
      toast({
        title: "Error",
        description: "Failed to approve budget version",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'draft': return <Clock className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
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
          <p className="text-gray-600 mt-1">Track and manage budget versions across projects</p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by version title or project..."
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
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
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
      </div>

      {filteredVersions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <GitBranch className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all' || projectFilter !== 'all' ? 'No matching versions' : 'No budget versions yet'}
          </h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' || projectFilter !== 'all'
              ? 'Try adjusting your search criteria'
              : 'Budget versions will appear here when created'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVersions.map((version) => (
            <Card key={version.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <GitBranch className="mr-2 h-5 w-5" />
                    {version.title}
                  </CardTitle>
                  <Badge className={getStatusColor(version.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(version.status)}
                      <span>{version.status}</span>
                    </div>
                  </Badge>
                </div>
                <CardDescription>
                  v{version.version_number} • {version.projects?.name || 'Unknown Project'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p><strong>Created:</strong> {new Date(version.created_at).toLocaleDateString()}</p>
                  {version.approved_at && (
                    <p><strong>Approved:</strong> {new Date(version.approved_at).toLocaleDateString()}</p>
                  )}
                </div>
                
                {version.status === 'pending' && (
                  <Button
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => approveVersion(version.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Version
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BudgetVersioning;
