import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Building2, DollarSign, Calendar, Users, ChevronLeft, ChevronRight } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  total_budget: number;
  allocated_budget: number;
  spent_budget: number;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  manager_id?: string;
  business_unit_id?: string;
}

interface BusinessUnit {
  id: string;
  name: string;
}

export const AdminProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    total_budget: 0,
    currency: 'USD',
    status: 'planning',
    start_date: '',
    end_date: '',
    business_unit_id: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
    fetchBusinessUnits();
  }, []);

  const fetchProjects = async () => {
    try {
      // Fetch all projects without pagination limit for admin dashboard
      const data = await apiClient.getProjects({ limit: 1000 });
      setProjects(data?.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessUnits = async () => {
    try {
      const data = await apiClient.getBusinessUnits();
      setBusinessUnits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching business units:', error);
      // Fallback to hardcoded values if API fails
      setBusinessUnits([
        { id: '1', name: 'Elixone Tech' },
        { id: '2', name: 'Capra communication' },
        { id: '3', name: 'Vasta Talent' },
        { id: '4', name: 'WASH' }
      ]);
    }
  };

  const saveProject = async () => {
    try {
      if (editingProject) {
        await apiClient.updateProject(editingProject.id, projectData);

        toast({
          title: "Success",
          description: "Project updated successfully"
        });
      } else {
        await apiClient.createProject(projectData);

        toast({
          title: "Success",
          description: "Project created successfully"
        });
      }

      setDialogOpen(false);
      setEditingProject(null);
      setProjectData({
        name: '',
        description: '',
        total_budget: 0,
        currency: 'USD',
        status: 'planning',
        start_date: '',
        end_date: '',
        business_unit_id: ''
      });
      fetchProjects();
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save project",
        variant: "destructive"
      });
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await apiClient.deleteProject(id);

      toast({
        title: "Success",
        description: "Project deleted successfully"
      });

      fetchProjects();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete project",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setProjectData({
      name: project.name,
      description: project.description || '',
      total_budget: project.total_budget,
      currency: (project as any).currency || 'USD',
      status: project.status,
      start_date: project.start_date ? project.start_date.split('T')[0] : '',
      end_date: project.end_date ? project.end_date.split('T')[0] : '',
      business_unit_id: project.business_unit_id || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProject(null);
    setProjectData({
      name: '',
      description: '',
      total_budget: 0,
      currency: 'USD',
      status: 'planning',
      start_date: '',
      end_date: '',
      business_unit_id: ''
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'planning': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBudgetUtilization = (project: Project) => {
    if (project.total_budget === 0) return 0;
    return (project.spent_budget / project.total_budget) * 100;
  };

  // Pagination logic
  const totalPages = Math.ceil(projects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = projects.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Management</h2>
          <p className="text-gray-600">Manage all projects and their budgets</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </DialogTitle>
              <DialogDescription>
                {editingProject ? 'Update project details and budget' : 'Add a new project to the system'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={projectData.name}
                  onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={projectData.description}
                  onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="business_unit">Business Unit</Label>
                <Select 
                  value={projectData.business_unit_id} 
                  onValueChange={(value) => setProjectData({ ...projectData, business_unit_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessUnits.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="total_budget">Total Budget</Label>
                  <Input
                    id="total_budget"
                    type="number"
                    value={projectData.total_budget}
                    onChange={(e) => {
                      let value = e.target.value;
                      // Remove leading zeros but keep single zero
                      if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
                        value = value.replace(/^0+/, '');
                      }
                      // If all zeros were removed, set to empty string
                      if (value === '') {
                        value = '';
                      }
                      setProjectData({ ...projectData, total_budget: value === '' ? 0 : Number(value) });
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={projectData.currency} onValueChange={(value) => setProjectData({ ...projectData, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="ETB">Ethiopian Birr (ETB)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={projectData.status} onValueChange={(value) => setProjectData({ ...projectData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={projectData.start_date}
                    onChange={(e) => setProjectData({ ...projectData, start_date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={projectData.end_date}
                    onChange={(e) => setProjectData({ ...projectData, end_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveProject}>
                {editingProject ? 'Update' : 'Create'} Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">All projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(project => project.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${projects.filter(project => project.status === 'active').reduce((sum, project) => {
                // Convert ETB to USD if needed (ETB to USD rate: ~0.018)
                const budget = project.total_budget || 0;
                const currency = (project as any).currency || 'USD';
                const rate = currency === 'ETB' ? 0.018 : 1;
                return sum + (budget * rate);
              }, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Active projects only</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${projects.filter(project => project.status === 'active').reduce((sum, project) => {
                // Convert ETB to USD if needed (ETB to USD rate: ~0.018)
                const spent = project.spent_budget || 0;
                const currency = (project as any).currency || 'USD';
                const rate = currency === 'ETB' ? 0.018 : 1;
                return sum + (spent * rate);
              }, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Active projects budget utilized</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>
            View and manage all projects in the system ({projects.length} total projects)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Spent</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                    <p className="text-gray-600">Create your first project to get started</p>
                  </TableCell>
                </TableRow>
              ) : currentProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                    <p className="text-gray-600">No projects match the current page</p>
                  </TableCell>
                </TableRow>
              ) : (
                currentProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(project.status)}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>${project.total_budget.toLocaleString()}</TableCell>
                    <TableCell>${(project.spent_budget || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(getBudgetUtilization(project), 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {getBudgetUtilization(project).toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}
                    </TableCell>
                    <TableCell>
                      {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(project)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteProject(project.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Pagination Controls */}
          {projects.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, projects.length)} of {projects.length} projects
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};