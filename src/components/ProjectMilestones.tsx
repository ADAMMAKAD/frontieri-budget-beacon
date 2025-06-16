
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Target, Plus, Calendar, BarChart, Search, Filter } from 'lucide-react';
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
      const [milestonesResult, projectsResult] = await Promise.all([
        supabase.from('project_milestones').select('*').order('due_date', { ascending: true }),
        supabase.from('projects').select('id, name')
      ]);

      if (milestonesResult.error) throw milestonesResult.error;
      if (projectsResult.error) throw projectsResult.error;

      setMilestones(milestonesResult.data || []);
      setProjects(projectsResult.data || []);
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
        const { error } = await supabase
          .from('project_milestones')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMilestone.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Milestone updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('project_milestones')
          .insert([{
            ...formData,
            created_by: user?.id
          }]);

        if (error) throw error;

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
      const { error } = await supabase
        .from('project_milestones')
        .delete()
        .eq('id', id);

      if (error) throw error;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
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

  const resetForm = () => {
    setEditingMilestone(null);
    setFormData({
      project_id: '',
      title: '',
      description: '',
      due_date: '',
      status: 'not_started',
      progress: 0
    });
    setIsCreating(false);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Milestones</h2>
          <p className="text-gray-600 mt-1">Track and manage project milestones and deliverables</p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Milestone
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search milestones by title, description, or project..."
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
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="delayed">Delayed</SelectItem>
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

      {/* Project Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => {
          const projectMilestones = milestones.filter(m => m.project_id === project.id);
          const progress = getProjectProgress(project.id);
          const completedMilestones = projectMilestones.filter(m => m.status === 'completed').length;
          
          return (
            <Card key={project.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <CardDescription>
                  {completedMilestones} of {projectMilestones.length} milestones completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>{editingMilestone ? 'Edit Milestone' : 'Create Milestone'}</span>
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
              <Button onClick={saveMilestone}>
                {editingMilestone ? 'Update' : 'Create'} Milestone
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart className="h-5 w-5" />
            <span>Milestones Timeline</span>
          </CardTitle>
          <CardDescription>
            Track milestone progress and deadlines ({filteredMilestones.length} of {milestones.length} milestones)
          </CardDescription>
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
                        >
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
