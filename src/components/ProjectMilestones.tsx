
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Target, Plus, Calendar, BarChart, Search, Filter, TrendingUp, Clock, CheckCircle, AlertTriangle, Activity, Eye, Download, RefreshCw, Zap } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Milestone {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  due_date: string;
  status: string;
  progress: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
}

const ProjectMilestones = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    due_date: '',
    status: 'not_started',
    progress: 0
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [milestonesResponse, projectsResponse] = await Promise.all([
        apiClient.get('/project-milestones'),
        apiClient.get('/projects')
      ]);

      if (milestonesResponse.error) throw new Error(milestonesResponse.error);
      if (projectsResponse.error) throw new Error(projectsResponse.error);

      setMilestones(milestonesResponse.data || []);
      setProjects(projectsResponse.projects || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load milestones",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveMilestone = async () => {
    try {
      if (!formData.project_id || !formData.title || !formData.due_date) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      if (editingMilestone) {
        // Update existing milestone
        const response = await apiClient.put(`/project-milestones/${editingMilestone.id}`, {
          ...formData,
          updated_at: new Date().toISOString()
        });

        if (response.error) throw new Error(response.error);

        toast({
          title: "Success",
          description: "Milestone updated successfully"
        });
      } else {
        // Create new milestone
        const response = await apiClient.post('/project-milestones', {
          ...formData,
          created_by: user?.id
        });

        if (response.error) throw new Error(response.error);

        toast({
          title: "Success",
          description: "Milestone created successfully"
        });
      }

      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving milestone:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save milestone",
        variant: "destructive"
      });
    }
  };

  const deleteMilestone = async (id: string) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return;

    try {
      const response = await apiClient.delete(`/project-milestones/${id}`);

      if (response.error) throw new Error(response.error);

      toast({
        title: "Success",
        description: "Milestone deleted successfully"
      });

      fetchData();
    } catch (error: any) {
      console.error('Error deleting milestone:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete milestone",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: '',
      title: '',
      description: '',
      due_date: '',
      status: 'not_started',
      progress: 0
    });
    setIsCreating(false);
    setEditingMilestone(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const editMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setFormData({
      project_id: milestone.project_id || '',
      title: milestone.title,
      description: milestone.description || '',
      due_date: milestone.due_date,
      status: milestone.status,
      progress: milestone.progress
    });
    setIsCreating(true);
  };

  const filteredMilestones = milestones.filter(milestone => {
    const project = projects.find(p => p.id === milestone.project_id);
    const projectName = project?.name || '';
    
    const matchesSearch = 
      milestone.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      milestone.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projectName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || milestone.status === statusFilter;
    const matchesProject = projectFilter === 'all' || milestone.project_id === projectFilter;

    return matchesSearch && matchesStatus && matchesProject;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setProjectFilter('all');
  };

  // Calculate overall project progress
  const getProjectProgress = (projectId: string) => {
    const projectMilestones = milestones.filter(m => m.project_id === projectId);
    if (projectMilestones.length === 0) return 0;
    
    const totalProgress = projectMilestones.reduce((sum, m) => sum + m.progress, 0);
    return Math.round(totalProgress / projectMilestones.length);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 p-6 space-y-8">
      {/* Enhanced Header with Analytics */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Project Milestones
          </h1>
          <p className="text-gray-600 text-lg">Advanced milestone tracking and project deliverables management</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Activity className="h-4 w-4 text-orange-500" />
              <span>Real-time tracking</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-orange-500" />
              <span>Smart analytics</span>
            </div>
          </div>
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-orange-600 to-red-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Milestone
        </Button>
      </div>

      {/* Enhanced Search and Filter Controls */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Search className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900">Search & Filter</CardTitle>
              <CardDescription className="text-gray-600">Find and filter milestones across all projects</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 h-4 w-4" />
              <Input
                placeholder="Search milestones by title, description, or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-48 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20">
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
              <Button variant="outline" onClick={clearFilters} className="border-orange-200 text-orange-600 hover:bg-orange-50">
                <Filter className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Project Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const projectMilestones = milestones.filter(m => m.project_id === project.id);
          const progress = getProjectProgress(project.id);
          const completedMilestones = projectMilestones.filter(m => m.status === 'completed').length;
          const inProgressMilestones = projectMilestones.filter(m => m.status === 'in_progress').length;
          const delayedMilestones = projectMilestones.filter(m => m.status === 'delayed').length;
          
          return (
            <Card key={project.id} className="bg-gradient-to-br from-white to-orange-50/30 border-orange-200 hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                      <Target className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900 group-hover:text-orange-900">{project.name}</CardTitle>
                      <CardDescription className="text-gray-600">
                        {completedMilestones} of {projectMilestones.length} milestones completed
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">{progress}%</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Overall Progress</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3 bg-orange-100" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <div className="font-semibold text-green-700">{completedMilestones}</div>
                      <div className="text-green-600">Completed</div>
                    </div>
                    <div className="text-center p-2 bg-orange-50 rounded-lg">
                      <div className="font-semibold text-orange-700">{inProgressMilestones}</div>
                      <div className="text-orange-600">In Progress</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded-lg">
                      <div className="font-semibold text-red-700">{delayedMilestones}</div>
                      <div className="text-red-600">Delayed</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isCreating && (
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
              <span className="text-xl text-gray-900">{editingMilestone ? 'Edit Milestone' : 'Create Milestone'}</span>
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
                <Label htmlFor="title">Milestone Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Phase 1 Completion"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the milestone deliverables..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="progress">Progress (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData(prev => ({ ...prev, progress: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={saveMilestone} className="bg-gradient-to-r from-orange-600 to-red-600">
                {editingMilestone ? 'Update' : 'Create'} Milestone
              </Button>
              <Button variant="outline" onClick={resetForm} className="border-orange-200 text-orange-600 hover:bg-orange-50">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-orange-50/50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900">Milestones Timeline</CardTitle>
                <CardDescription className="text-gray-600">
                  Track milestone progress and deadlines ({filteredMilestones.length} of {milestones.length} milestones)
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                <RefreshCw className="mr-1 h-3 w-3" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                <Download className="mr-1 h-3 w-3" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Milestone</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMilestones.map((milestone) => {
                const project = projects.find(p => p.id === milestone.project_id);
                const isOverdue = new Date(milestone.due_date) < new Date() && milestone.status !== 'completed';
                
                return (
                  <TableRow key={milestone.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{milestone.title}</div>
                        {milestone.description && (
                          <div className="text-sm text-gray-500">{milestone.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{project?.name || 'Unknown Project'}</TableCell>
                    <TableCell>
                      <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
                        {format(new Date(milestone.due_date), 'MMM dd, yyyy')}
                        {isOverdue && <div className="text-xs">Overdue</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(milestone.status)}>
                        {milestone.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="w-20">
                        <Progress value={milestone.progress} className="h-2" />
                        <div className="text-xs text-center mt-1">{milestone.progress}%</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editMilestone(milestone)}
                          className="border-orange-200 text-orange-600 hover:bg-orange-50"
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMilestone(milestone.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredMilestones.length === 0 && (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' || projectFilter !== 'all' 
                  ? 'No matching milestones' 
                  : 'No milestones found'
                }
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || projectFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'Create your first milestone to get started'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectMilestones;
