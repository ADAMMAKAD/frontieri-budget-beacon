
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Calendar, DollarSign, Users, Edit, Trash2, Save, X, 
  Search, Filter, Grid3X3, List, Eye, TrendingUp, AlertTriangle,
  Clock, Target, BarChart3, ArrowUpRight, ArrowDownRight, Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProjectRefresh } from '@/contexts/ProjectContext';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  allocated_budget: number;
  spent_budget: number;
  business_unit_name: string;
  business_unit_id: string;
  currency: string; // Add currency field
  project_manager_id: string;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'budget' | 'status' | 'date' | 'spent';

const BudgetPlanning = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [businessUnits, setBusinessUnits] = useState<{id: string, name: string}[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [businessUnitFilter, setBusinessUnitFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    total_budget: '',
    business_unit_id: '',
    currency: 'USD' // Add currency with default value
  });
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [selectedProjectAdmin, setSelectedProjectAdmin] = useState<string>('');
  const [editProject, setEditProject] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    total_budget: '',
    business_unit_id: '',
    currency: 'USD' // Add currency field
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const { triggerRefresh } = useProjectRefresh();

  useEffect(() => {
    fetchProjects();
    fetchBusinessUnits();
    fetchAvailableUsers();
  }, []);

  const fetchBusinessUnits = async () => {
    try {
      const data = await apiClient.getBusinessUnits();
      setBusinessUnits(data.business_units || []);
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

  const fetchAvailableUsers = async () => {
    try {
      console.log('🔍 Fetching available users...');
      const data = await apiClient.getAvailableUsers();
      console.log('📋 Available users response:', data);
      setAvailableUsers(data.users || []);
    } catch (error) {
      console.error('❌ Error fetching available users:', error);
      setAvailableUsers([]);
    }
  };

  useEffect(() => {
    filterAndSortProjects();
  }, [projects, searchTerm, statusFilter, businessUnitFilter, sortBy, sortOrder]);

  const fetchProjects = async () => {
    try {
      const response = await apiClient.getProjects({ order: 'created_at:desc', limit: 1000 });
      
      if (response.error) {
        throw new Error(typeof response.error === 'object' && response.error && 'message' in response.error ? response.error.message as string : 'Failed to fetch projects');
      }
      
      console.log('📋 Fetch Projects Response:', response);
      
      // Handle different response formats
      let projectsArray: Project[] = [];
      
      if (Array.isArray(response)) {
        projectsArray = response;
      } else if (response.projects && Array.isArray(response.projects)) {
        projectsArray = response.projects;
      } else if (response.data) {
        if (Array.isArray(response.data)) {
          projectsArray = response.data;
        } else if (response.data.projects && Array.isArray(response.data.projects)) {
          projectsArray = response.data.projects;
        }
      }
      
      console.log('📋 Parsed Projects Array:', projectsArray);
      setProjects(projectsArray);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive"
      });
    }
  };

  const filterAndSortProjects = () => {
    let filtered = projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (project.business_unit_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesBusinessUnit = businessUnitFilter === 'all' || project.business_unit_id?.toString() === businessUnitFilter;
      
      return matchesSearch && matchesStatus && matchesBusinessUnit;
    });

    // Sort projects
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'budget':
          aValue = a.total_budget;
          bValue = b.total_budget;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'date':
          aValue = new Date(a.start_date).getTime();
          bValue = new Date(b.start_date).getTime();
          break;
        case 'spent':
          aValue = a.spent_budget;
          bValue = b.spent_budget;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredProjects(filtered);
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that a project admin is selected
    if (!selectedProjectAdmin || selectedProjectAdmin.trim() === '') {
      toast({
        title: "Validation Error",
        description: "Please select a Project Admin. This field is required.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const projectData = {
        name: newProject.name,
        description: newProject.description,
        total_budget: parseFloat(newProject.total_budget), // Backend expects total_budget, not budget
        start_date: newProject.start_date, // Backend expects start_date, not startDate
        end_date: newProject.end_date, // Backend expects end_date, not endDate
        business_unit_id: newProject.business_unit_id,
        currency: newProject.currency || 'USD' // Add currency support
      };
  
      const response = await apiClient.createProject(projectData);
      
      if (response.error) {
        throw new Error(typeof response.error === 'object' && response.error && 'message' in response.error ? response.error.message as string : 'Failed to create project');
      }
  
      // Assign the selected project admin (only if different from creator)
      if (response.project?.id && selectedProjectAdmin !== user?.id) {
        try {
          await apiClient.createProjectTeam({
            project_id: response.project.id,
            user_id: selectedProjectAdmin,
            role: 'admin'
          });
        } catch (adminError) {
          console.error('Error adding project admin:', adminError);
        }
      }
      
      // Create project team entries for selected members (excluding the admin if already in the list)
      if (selectedTeamMembers.length > 0 && response.project?.id) {
        for (const userId of selectedTeamMembers) {
          // Skip if this user is already assigned as admin
          if (userId === selectedProjectAdmin) continue;
          
          try {
            await apiClient.createProjectTeam({
              project_id: response.project.id,
              user_id: userId,
              role: 'member'
            });
          } catch (teamError) {
            console.error('Error adding team member:', teamError);
          }
        }
      }

      toast({
        title: "Success",
        description: "Project created successfully"
      });
      setIsCreating(false);
      setNewProject({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        total_budget: '',
        business_unit_id: '',
        currency: 'USD'
      });
      setSelectedTeamMembers([]);
      setSelectedProjectAdmin('');
      fetchProjects();
      triggerRefresh(); // Trigger global refresh for all components
    } catch (error) {
      console.error('Create project error:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-orange-100 text-orange-800';
      case 'on-hold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSpendColor = (project: any) => {
    const spentPercentage = project.total_budget > 0 ? (project.spent_budget / project.total_budget) * 100 : 0;
    const timeElapsed = getTimeElapsedPercentage(project.start_date, project.end_date);
    
    const warningThreshold = 80;
    const dangerThreshold = 100;
    
    const expectedSpend = (timeElapsed / 100) * project.total_budget;
    const actualVsExpected = project.spent_budget / expectedSpend;
    
    if (spentPercentage >= dangerThreshold || actualVsExpected > 1.2) {
      return 'text-red-600 font-semibold';
    } else if (spentPercentage >= warningThreshold || actualVsExpected > 1.0) {
      return 'text-yellow-600 font-semibold';
    } else {
      return 'text-green-600 font-semibold';
    }
  };
  
  const getTimeElapsedPercentage = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    return ((now - start) / (end - start)) * 100;
  };

  const updateProject = async (projectId: string) => {
    try {
      const response = await apiClient.updateProject(projectId, {
        name: editProject.name,
        description: editProject.description,
        total_budget: parseFloat(editProject.total_budget),
        start_date: editProject.start_date,
        end_date: editProject.end_date,
        business_unit_id: editProject.business_unit_id,
        currency: editProject.currency
      });
  
      if (response.error) {
        throw new Error(typeof response.error === 'object' && response.error && 'message' in response.error ? response.error.message as string : 'Failed to update project');
      }
  
      toast({
        title: "Success",
        description: "Project updated successfully"
      });
  
      setEditingProject(null);
      fetchProjects();
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive"
      });
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiClient.deleteProject(projectId);

      if (response.error) {
        throw new Error(typeof response.error === 'object' && response.error && 'message' in response.error ? response.error.message as string : 'Failed to delete project');
      }

      toast({
        title: "Success",
        description: "Project deleted successfully"
      });

      fetchProjects();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive"
      });
    }
  };

  const startEditing = (project: Project) => {
    setEditingProject(project.id);
    setEditProject({
        name: project.name,
        description: project.description,
        start_date: project.start_date,
        end_date: project.end_date,
        total_budget: project.total_budget.toString(),
        business_unit_id: project.business_unit_id,
        currency: project.currency || 'USD'
      });
  };

  const cancelEditing = () => {
    setEditingProject(null);
    setEditProject({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      total_budget: '',
      business_unit_id: '',
      currency: 'USD' // Reset currency
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    try {
      if (!startDate || !endDate) return 'Dates not set';
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 'Invalid dates';
      }
      
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    } catch (error) {
      return 'Invalid dates';
    }
  };

  const getBusinessUnits = () => {
    return businessUnits;
  };

  const getBusinessUnitNames = () => {
    return businessUnits.map(unit => unit.name);
  };

  const getProjectStats = (project: Project) => {
    const spentPercentage = project.total_budget > 0 ? (project.spent_budget / project.total_budget) * 100 : 0;
    const timeElapsed = getTimeElapsedPercentage(project.start_date, project.end_date);
    const remaining = project.total_budget - project.spent_budget;
    const daysRemaining = Math.ceil((new Date(project.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      spentPercentage,
      timeElapsed,
      remaining,
      daysRemaining
    };
  };

  // Project Detail Modal Component
  const ProjectDetailModal = ({ project }: { project: Project }) => {
    const stats = getProjectStats(project);
    const [projectTeam, setProjectTeam] = useState<any[]>([]);
    const [loadingTeam, setLoadingTeam] = useState(false);
    
    useEffect(() => {
      const fetchProjectTeam = async () => {
      try {
        setLoadingTeam(true);
        const response = await apiClient.getProjectTeams(project.id);
        setProjectTeam(response.project_teams || []);
      } catch (error) {
        console.error('Failed to fetch project team:', error);
        setProjectTeam([]);
      } finally {
        setLoadingTeam(false);
      }
    };
      
      fetchProjectTeam();
    }, [project.id]);
    
    return (
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {project.name}
            <Badge className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-lg">
            {project.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Budget</p>
                  <p className="text-xl font-bold">{project.currency === 'ETB' ? 'Br' : '$'}{project.total_budget?.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Spent</p>
                  <p className="text-xl font-bold">{project.currency === 'ETB' ? 'Br' : '$'}{project.spent_budget?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{stats.spentPercentage.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Remaining</p>
                  <p className="text-xl font-bold">{project.currency === 'ETB' ? 'Br' : '$'}{stats.remaining?.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Days Left</p>
                  <p className="text-xl font-bold">{stats.daysRemaining > 0 ? stats.daysRemaining : 'Overdue'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Project Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Duration: {formatDateRange(project.start_date, project.end_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Business Unit: {project.business_unit_name}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Project Team</h3>
            {loadingTeam ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                Loading team...
              </div>
            ) : projectTeam.length > 0 ? (
              <div className="space-y-3">
                {/* Project Creator Section */}
                {(() => {
                  const projectCreator = projectTeam.find(member => member.user_id === project.project_manager_id);
                  return projectCreator && (
                    <div>
                      <h4 className="text-sm font-semibold text-orange-600 mb-2">Project Creator</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {(projectCreator.full_name || projectCreator.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{projectCreator.full_name || projectCreator.email}</p>
                            <p className="text-xs text-gray-500">{projectCreator.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="text-xs bg-orange-600 text-white">
                              Project Admin
                            </Badge>
                            <Button size="sm" variant="outline" className="text-xs h-6 px-2">
                              Expense Approval
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                {/* Other Project Admins Section */}
                {(() => {
                  const otherAdmins = projectTeam.filter(member => 
                    (member.role === 'admin' || member.role === 'manager') && 
                    member.user_id !== project.project_manager_id
                  );
                  return otherAdmins.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-blue-600 mb-2">Project Admin{otherAdmins.length > 1 ? 's' : ''}</h4>
                      <div className="space-y-2">
                        {otherAdmins.map((admin) => (
                          <div key={admin.id} className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {(admin.full_name || admin.email).charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{admin.full_name || admin.email}</p>
                              <p className="text-xs text-gray-500">{admin.email}</p>
                            </div>
                            <Badge variant="default" className="text-xs bg-blue-600">
                              Project Admin
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                
                {/* Team Members Section */}
                {(() => {
                  const members = projectTeam.filter(member => member.role !== 'admin' && member.role !== 'manager');
                  return members.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-2">Team Members ({members.length})</h4>
                      <div className="space-y-2">
                        {members.map((member) => (
                          <div key={member.id} className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {(member.full_name || member.email).charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{member.full_name || member.email}</p>
                              <p className="text-xs text-gray-500">{member.email}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {member.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No team members assigned</p>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Budget Progress</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Budget Utilization</span>
                  <span>{stats.spentPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      stats.spentPercentage > 100 ? 'bg-red-500' :
                      stats.spentPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(stats.spentPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Time Progress</span>
                  <span>{stats.timeElapsed.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: `${Math.min(stats.timeElapsed, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {stats.spentPercentage > 90 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-medium">Budget Alert</span>
            </div>
            <p className="text-red-700 text-sm mt-1">
              This project has used {stats.spentPercentage.toFixed(1)}% of its budget. Consider reviewing expenses.
            </p>
          </div>
        )}
      </DialogContent>
    );
  };

  // Enhanced Grid View Component
  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredProjects.map((project, index) => {
        const stats = getProjectStats(project);
        return (
          <Card 
            key={project.id} 
            className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-md bg-gradient-to-br from-white to-gray-50/50 overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Status indicator bar */}
            <div className={`h-1 w-full ${
              project.status === 'active' ? 'bg-gradient-to-r from-green-400 to-green-600' :
              project.status === 'planning' ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
              project.status === 'completed' ? 'bg-gradient-to-r from-purple-400 to-purple-600' :
              'bg-gradient-to-r from-yellow-400 to-yellow-600'
            }`} />
            
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {editingProject === project.id ? (
                    <Input
                      value={editProject.name}
                      onChange={(e) => setEditProject(prev => ({ ...prev, name: e.target.value }))}
                      className="text-lg font-bold mb-2"
                    />
                  ) : (
                    <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2">
                      {project.name}
                    </CardTitle>
                  )}
                  {editingProject === project.id ? (
                    <Textarea
                      value={editProject.description}
                      onChange={(e) => setEditProject(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="mt-2"
                    />
                  ) : (
                    <CardDescription className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {project.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={`${getStatusColor(project.status)} text-xs font-medium px-2 py-1 rounded-full`}>
                    {project.status}
                  </Badge>
                  {editingProject === project.id ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateProject(project.id)}
                        className="text-green-600 hover:bg-green-50"
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEditing}
                        className="text-gray-600 hover:bg-gray-50"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {editingProject === project.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`start-${project.id}`} className="text-xs">Start Date</Label>
                      <Input
                        id={`start-${project.id}`}
                        type="date"
                        value={editProject.start_date}
                        onChange={(e) => setEditProject(prev => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`end-${project.id}`} className="text-xs">End Date</Label>
                      <Input
                        id={`end-${project.id}`}
                        type="date"
                        value={editProject.end_date}
                        onChange={(e) => setEditProject(prev => ({ ...prev, end_date: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`budget-${project.id}`} className="text-xs">Total Budget</Label>
                    <Input
                      id={`budget-${project.id}`}
                      type="number"
                      value={editProject.total_budget}
                      onChange={(e) => {
                        let value = e.target.value;
                        // Remove leading zeros but keep single zero and decimals
                        if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
                          value = value.replace(/^0+/, '');
                        }
                        // If all zeros were removed, set to empty string
                        if (value === '') {
                          value = '';
                        }
                        setEditProject(prev => ({ ...prev, total_budget: value }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`bu-${project.id}`} className="text-xs">Business Unit</Label>
                    <Select
                      value={editProject.business_unit_id}
                      onValueChange={(value) => setEditProject(prev => ({ ...prev, business_unit_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select business unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {getBusinessUnits().map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <>
                  {/* Budget Overview */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Budget Progress</span>
                      <span className={`text-sm font-bold ${
                        stats.spentPercentage > 100 ? 'text-red-600' :
                        stats.spentPercentage > 80 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {stats.spentPercentage.toFixed(1)}%
                      </span>
                    </div>
                    
                    {/* Enhanced Progress Bar */}
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            stats.spentPercentage > 100 ? 'bg-gradient-to-r from-red-400 to-red-600' :
                            stats.spentPercentage > 80 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 
                            'bg-gradient-to-r from-green-400 to-green-600'
                          }`}
                          style={{ width: `${Math.min(stats.spentPercentage, 100)}%` }}
                        />
                      </div>
                      {stats.spentPercentage > 100 && (
                        <div className="absolute -top-1 -right-1">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Spent: {project.currency === 'ETB' ? 'Br' : '$'}{project.spent_budget?.toLocaleString() || '0'}</span>
                      <span>Total: {project.currency === 'ETB' ? 'Br' : '$'}{project.total_budget?.toLocaleString() || '0'}</span>
                    </div>
                  </div>
                  
                  {/* Project Details */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      <span>{formatDateRange(project.start_date, project.end_date)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">{project.business_unit_name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span>{stats.daysRemaining > 0 ? `${stats.daysRemaining} days left` : 'Overdue'}</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          onClick={() => setSelectedProject(project)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      {selectedProject && <ProjectDetailModal project={selectedProject} />}
                    </Dialog>
                    
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                        onClick={() => startEditing(project)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deleteProject(project.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // Enhanced List View Component
  const ListView = () => (
    <div className="space-y-4">
      {filteredProjects.map((project, index) => {
        const stats = getProjectStats(project);
        return (
          <Card 
            key={project.id} 
            className="group hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-gradient-to-r from-white to-gray-50/30"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-gray-600 mt-1">{project.description}</p>
                    </div>
                    <Badge className={`${getStatusColor(project.status)} text-sm font-medium px-3 py-1 rounded-full`}>
                      {project.status}
                    </Badge>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Calendar className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Duration</p>
                        <p className="text-sm font-semibold text-gray-900">{formatDateRange(project.start_date, project.end_date)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Total Budget</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {project.currency === 'ETB' ? 'Br' : '$'}{project.total_budget?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Business Unit</p>
                        <p className="text-sm font-semibold text-gray-900">{project.business_unit_name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        stats.spentPercentage > 100 ? 'bg-red-100' :
                        stats.spentPercentage > 80 ? 'bg-yellow-100' : 'bg-green-100'
                      }`}>
                        <BarChart3 className={`h-5 w-5 ${
                          stats.spentPercentage > 100 ? 'text-red-600' :
                          stats.spentPercentage > 80 ? 'text-yellow-600' : 'text-green-600'
                        }`} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Progress</p>
                        <p className={`text-sm font-semibold ${
                          stats.spentPercentage > 100 ? 'text-red-600' :
                          stats.spentPercentage > 80 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {stats.spentPercentage.toFixed(1)}% spent
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Budget Utilization</span>
                      <span className="font-medium">
                        {project.currency === 'ETB' ? 'Br' : '$'}{project.spent_budget?.toLocaleString()} / 
                        {project.currency === 'ETB' ? 'Br' : '$'}{project.total_budget?.toLocaleString()}
                      </span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${
                            stats.spentPercentage > 100 ? 'bg-gradient-to-r from-red-400 to-red-600' :
                            stats.spentPercentage > 80 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 
                            'bg-gradient-to-r from-green-400 to-green-600'
                          }`}
                          style={{ width: `${Math.min(stats.spentPercentage, 100)}%` }}
                        />
                      </div>
                      {stats.spentPercentage > 100 && (
                        <div className="absolute -top-1 -right-1">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col gap-2 ml-6">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-orange-200 text-orange-600 hover:bg-orange-50"
                        onClick={() => setSelectedProject(project)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    {selectedProject && <ProjectDetailModal project={selectedProject} />}
                  </Dialog>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-200 text-gray-600 hover:bg-gray-50"
                    onClick={() => startEditing(project)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => deleteProject(project.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 p-6 space-y-8">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Budget Planning
          </h1>
          <p className="text-gray-600 text-lg">Create and manage project budgets with advanced analytics</p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 text-lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          New Project
        </Button>
      </div>

      {/* Enhanced Search and Filters */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-gray-200 focus:border-orange-500">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Business Unit Filter */}
            <div>
              <Select value={businessUnitFilter} onValueChange={setBusinessUnitFilter}>
                <SelectTrigger className="border-gray-200 focus:border-orange-500">
                  <SelectValue placeholder="Business Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Business Units</SelectItem>
                  {businessUnits.map(unit => (
                    <SelectItem key={unit.id} value={unit.id.toString()}>{unit.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Sort By */}
            <div>
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="border-gray-200 focus:border-orange-500">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="spent">Spent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-orange-600 hover:bg-orange-700' : 'border-gray-200'}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-orange-600 hover:bg-orange-700' : 'border-gray-200'}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="border-gray-200 hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {/* Results Summary */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredProjects.length}</span> of <span className="font-semibold text-gray-900">{projects.length}</span> projects
            </div>
            {filteredProjects.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Zap className="h-4 w-4 text-orange-500" />
                <span>Live data</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Project Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
            <CardDescription>Set up a new project with budget planning</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createProject} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    value={newProject.name}
                    onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_unit_id">Business Unit</Label>
                  <Select 
                    value={newProject.business_unit_id?.toString() || ''} 
                    onValueChange={(value) => setNewProject(prev => ({ ...prev, business_unit_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select business unit">
                        {newProject.business_unit_id ? 
                          businessUnits.find(unit => unit.id.toString() === newProject.business_unit_id?.toString())?.name || 'Select business unit'
                          : 'Select business unit'
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {businessUnits.map(unit => (
                        <SelectItem key={unit.id} value={unit.id.toString()}>{unit.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newProject.start_date}
                    onChange={(e) => setNewProject(prev => ({ ...prev, start_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newProject.end_date}
                    onChange={(e) => setNewProject(prev => ({ ...prev, end_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalBudget">Total Budget</Label>
                  <Input
                    id="totalBudget"
                    type="number"
                    step="0.01"
                    value={newProject.total_budget}
                    onChange={(e) => {
                      let value = e.target.value;
                      // Remove leading zeros but keep single zero and decimals
                      if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
                        value = value.replace(/^0+/, '');
                      }
                      // If all zeros were removed, set to empty string
                      if (value === '') {
                        value = '';
                      }
                      setNewProject(prev => ({ ...prev, total_budget: value }));
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={newProject.currency} 
                    onValueChange={(value) => setNewProject(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="ETB">ETB - Ethiopian Birr</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Project Team Members</Label>
                <Select onValueChange={(value) => {
                  if (!selectedTeamMembers.includes(value)) {
                    setSelectedTeamMembers(prev => [...prev, value]);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team members" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">No users available</div>
                    ) : (
                      availableUsers
                        .filter(user => !selectedTeamMembers.includes(user.id))
                        .map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name || user.email}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
                {selectedTeamMembers.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">
                      {selectedTeamMembers.length} member{selectedTeamMembers.length !== 1 ? 's' : ''} selected:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTeamMembers.map(memberId => {
                        const user = availableUsers.find(u => u.id === memberId);
                        return (
                          <div key={memberId} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                            <span>{user?.full_name || user?.email || 'Unknown User'}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTeamMembers(prev => prev.filter(id => id !== memberId));
                                // Clear admin selection if the admin is being removed
                                if (selectedProjectAdmin === memberId) {
                                  setSelectedProjectAdmin('');
                                }
                              }}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Project Admin Selection */}
              <div className="space-y-2">
                <Label>Project Admin <span className="text-red-500">*</span></Label>
                <Select 
                  value={selectedProjectAdmin} 
                  onValueChange={(value) => setSelectedProjectAdmin(value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user as project admin" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <span>{user.full_name || user.email}</span>
                          <Badge variant="outline" className="text-xs">
                            {user.role}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProjectAdmin && selectedProjectAdmin !== 'none' && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-md text-sm">
                      <span className="font-medium">Project Admin:</span>
                      <span>
                        {availableUsers.find(u => u.id === selectedProjectAdmin)?.full_name || 
                         availableUsers.find(u => u.id === selectedProjectAdmin)?.email || 
                         'Unknown User'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Will have admin access to this project
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="bg-gradient-to-r from-orange-600 to-red-600">
                  Create Project
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Projects Display */}
      <div className="animate-in fade-in duration-500">
        {filteredProjects.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                <Target className="h-12 w-12 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {projects.length === 0 ? 'No projects yet' : 'No projects match your filters'}
              </h3>
              <p className="text-gray-600 mb-6">
                {projects.length === 0 
                  ? 'Get started by creating your first project to unlock powerful budget planning features'
                  : 'Try adjusting your search or filter criteria to find what you\'re looking for'
                }
              </p>
              {projects.length === 0 && (
                <Button 
                  onClick={() => setIsCreating(true)}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {viewMode === 'grid' ? <GridView /> : <ListView />}
          </>
        )}
      </div>
    </div>
  );
};

export default BudgetPlanning;