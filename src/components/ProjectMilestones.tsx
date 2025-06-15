
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Target, Calendar, Clock, Search, BarChart3 } from 'lucide-react';
import { format, parseISO, differenceInDays, addDays, startOfWeek, endOfWeek } from 'date-fns';

interface Milestone {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: string;
  progress: number;
  project_id: string;
  created_at: string;
  projects?: { name: string };
}

interface Project {
  id: string;
  name: string;
}

const ProjectMilestones = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [filteredMilestones, setFilteredMilestones] = useState<Milestone[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'gantt'>('list');
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    due_date: '',
    project_id: '',
    progress: 0
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterMilestones();
  }, [milestones, searchTerm, statusFilter]);

  const filterMilestones = () => {
    let filtered = milestones;

    if (searchTerm) {
      filtered = filtered.filter(milestone =>
        milestone.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        milestone.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        milestone.projects?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(milestone => milestone.status === statusFilter);
    }

    setFilteredMilestones(filtered);
  };

  const fetchData = async () => {
    await Promise.all([fetchMilestones(), fetchProjects()]);
  };

  const fetchMilestones = async () => {
    const { data, error } = await supabase
      .from('project_milestones')
      .select(`
        *,
        projects(name)
      `)
      .order('due_date', { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch milestones",
        variant: "destructive"
      });
    } else {
      setMilestones(data || []);
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

  const createMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('project_milestones')
      .insert([{
        ...newMilestone,
        created_by: user?.id
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create milestone",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Milestone created successfully"
      });
      setIsCreating(false);
      setNewMilestone({
        title: '',
        description: '',
        due_date: '',
        project_id: '',
        progress: 0
      });
      fetchMilestones();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateStatus = (milestone: Milestone) => {
    if (milestone.progress === 100) return 'completed';
    if (new Date(milestone.due_date) < new Date() && milestone.progress < 100) return 'overdue';
    if (milestone.progress > 0) return 'in_progress';
    return 'not_started';
  };

  const GanttView = () => {
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(addDays(today, 30)); // Show next 5 weeks
    const totalDays = differenceInDays(weekEnd, weekStart);

    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-4 flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Gantt Chart View
          </h3>
          
          {/* Timeline Header */}
          <div className="flex mb-4 text-xs text-gray-600 border-b pb-2">
            <div className="w-64 flex-shrink-0">Milestone</div>
            <div className="flex-1 grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }, (_, i) => {
                const date = addDays(weekStart, i);
                return (
                  <div key={i} className="text-center">
                    {format(date, 'MMM dd')}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gantt Bars */}
          <div className="space-y-3">
            {filteredMilestones.slice(0, 10).map((milestone) => {
              const dueDate = parseISO(milestone.due_date);
              const daysFromStart = differenceInDays(dueDate, weekStart);
              const position = Math.max(0, (daysFromStart / totalDays) * 100);
              const status = calculateStatus(milestone);

              return (
                <div key={milestone.id} className="flex items-center">
                  <div className="w-64 flex-shrink-0 pr-4">
                    <div className="font-medium text-sm">{milestone.title}</div>
                    <div className="text-xs text-gray-500">{milestone.projects?.name}</div>
                  </div>
                  <div className="flex-1 relative h-8 bg-gray-100 rounded">
                    <div
                      className={`absolute top-1 h-6 rounded flex items-center justify-center text-xs font-medium ${
                        status === 'completed' ? 'bg-green-500 text-white' :
                        status === 'overdue' ? 'bg-red-500 text-white' :
                        status === 'in_progress' ? 'bg-blue-500 text-white' :
                        'bg-gray-400 text-white'
                      }`}
                      style={{
                        left: `${Math.min(position, 85)}%`,
                        width: '12%',
                        minWidth: '60px'
                      }}
                    >
                      {milestone.progress}%
                    </div>
                    {/* Today indicator */}
                    {differenceInDays(today, weekStart) >= 0 && differenceInDays(today, weekStart) <= totalDays && (
                      <div
                        className="absolute top-0 w-0.5 h-8 bg-red-400"
                        style={{
                          left: `${(differenceInDays(today, weekStart) / totalDays) * 100}%`
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Milestones</h2>
          <p className="text-gray-600 mt-1">Track and manage project milestones</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
            size="sm"
          >
            List View
          </Button>
          <Button
            variant={viewMode === 'gantt' ? 'default' : 'outline'}
            onClick={() => setViewMode('gantt')}
            size="sm"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Gantt View
          </Button>
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Milestone
          </Button>
        </div>
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
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Milestone</CardTitle>
            <CardDescription>Create a new project milestone</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createMilestone} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select 
                    value={newMilestone.project_id} 
                    onValueChange={(value) => setNewMilestone(prev => ({ ...prev, project_id: value }))}
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
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={newMilestone.due_date}
                    onChange={(e) => setNewMilestone(prev => ({ ...prev, due_date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="progress">Progress (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={newMilestone.progress}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, progress: Number(e.target.value) }))}
                />
              </div>

              <div className="flex space-x-2">
                <Button type="submit" className="bg-gradient-to-r from-purple-600 to-blue-600">
                  Create Milestone
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {viewMode === 'gantt' ? (
        <GanttView />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMilestones.map((milestone) => {
            const status = calculateStatus(milestone);
            return (
              <Card key={milestone.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <Target className="mr-2 h-5 w-5" />
                      {milestone.title}
                    </CardTitle>
                    <Badge className={getStatusColor(status)}>
                      {status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <CardDescription>
                    {milestone.projects?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{milestone.description}</p>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {format(parseISO(milestone.due_date), 'MMM dd, yyyy')}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{milestone.progress}%</span>
                    </div>
                    <Progress value={milestone.progress} className="h-2" />
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>Created: {format(parseISO(milestone.created_at), 'MMM dd, yyyy')}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredMilestones.length === 0 && !isCreating && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all' ? 'No matching milestones' : 'No milestones yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search criteria'
              : 'Add your first milestone to get started'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button 
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Milestone
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectMilestones;
