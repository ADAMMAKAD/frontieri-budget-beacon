
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
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar, CheckCircle, Clock, AlertCircle, Edit, Save, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Project {
  id: string;
  name: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  progress: number;
  project_id: string;
  created_by: string;
  created_at: string;
}

const ProjectMilestones = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null);
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    due_date: '',
    status: 'not_started' as const,
    progress: 0
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchMilestones(selectedProject);
    }
  }, [selectedProject]);

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
      if (data && data.length > 0 && !selectedProject) {
        setSelectedProject(data[0].id);
      }
    }
  };

  const fetchMilestones = async (projectId: string) => {
    const { data, error } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('due_date');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch milestones",
        variant: "destructive"
      });
    } else {
      // Update overdue status
      const updatedMilestones = (data || []).map(milestone => {
        const isOverdue = new Date(milestone.due_date) < new Date() && milestone.status !== 'completed';
        return {
          ...milestone,
          status: isOverdue && milestone.status !== 'completed' ? 'overdue' : milestone.status
        };
      });
      setMilestones(updatedMilestones);
    }
  };

  const createMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject) {
      toast({
        title: "Error",
        description: "Please select a project",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('project_milestones')
      .insert([{
        project_id: selectedProject,
        title: newMilestone.title,
        description: newMilestone.description,
        due_date: newMilestone.due_date,
        status: newMilestone.status,
        progress: newMilestone.progress,
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
        status: 'not_started',
        progress: 0
      });
      fetchMilestones(selectedProject);
    }
  };

  const updateMilestone = async (milestoneId: string, updates: Partial<Milestone>) => {
    const { error } = await supabase
      .from('project_milestones')
      .update(updates)
      .eq('id', milestoneId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update milestone",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Milestone updated successfully"
      });
      fetchMilestones(selectedProject);
      setEditingMilestone(null);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'overdue': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const calculateProjectProgress = () => {
    if (milestones.length === 0) return 0;
    const totalProgress = milestones.reduce((sum, milestone) => sum + milestone.progress, 0);
    return Math.round(totalProgress / milestones.length);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Milestones</h2>
          <p className="text-gray-600 mt-1">Track project milestones and progress</p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
          disabled={!selectedProject}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Milestone
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Project</CardTitle>
          <CardDescription>Choose a project to view its milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>Overall project completion based on milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{calculateProjectProgress()}%</span>
              </div>
              <Progress value={calculateProjectProgress()} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Milestone</CardTitle>
            <CardDescription>Add a new milestone to track project progress</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createMilestone} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newMilestone.title}
                    onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Milestone title"
                    required
                  />
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Milestone description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={newMilestone.status} onValueChange={(value: any) => setNewMilestone(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
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
                    value={newMilestone.progress}
                    onChange={(e) => setNewMilestone(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600">
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

      {milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Milestones</CardTitle>
            <CardDescription>Track and manage project milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-lg">{milestone.title}</h4>
                      <Badge className={getStatusColor(milestone.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(milestone.status)}
                          <span>{milestone.status.replace('_', ' ')}</span>
                        </div>
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingMilestone(milestone.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{milestone.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Due: {new Date(milestone.due_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">Progress: {milestone.progress}%</span>
                    </div>
                  </div>
                  
                  <Progress value={milestone.progress} className="w-full" />
                  
                  {editingMilestone === milestone.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <Select 
                          value={milestone.status} 
                          onValueChange={(value: any) => updateMilestone(milestone.id, { status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_started">Not Started</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={milestone.progress}
                          onChange={(e) => updateMilestone(milestone.id, { progress: parseInt(e.target.value) || 0 })}
                          placeholder="Progress %"
                        />
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingMilestone(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedProject && milestones.length === 0 && !isCreating && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No milestones found</h3>
          <p className="text-gray-600 mb-4">Start tracking project milestones</p>
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add First Milestone
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProjectMilestones;
