import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Shield, 
  Calendar, 
  DollarSign, 
  Users, 
  Settings, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import ProjectAdminManagement from './ProjectAdminManagement';

interface AdminProject {
  id: string;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  admin_since: string;
}

interface ProjectStats {
  totalBudget: number;
  spentAmount: number;
  pendingExpenses: number;
  teamMembers: number;
}

export default function ProjectAdminDashboard() {
  const [adminProjects, setAdminProjects] = useState<AdminProject[]>([]);
  const [projectStats, setProjectStats] = useState<{ [key: string]: ProjectStats }>({});
  const [selectedProject, setSelectedProject] = useState<AdminProject | null>(null);
  const [isManagementDialogOpen, setIsManagementDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminProjects();
  }, []);

  const fetchAdminProjects = async () => {
    try {
      setLoading(true);
      const projects = await apiClient.getUserAdminProjects();
      setAdminProjects(projects);
      
      // Fetch stats for each project
      const stats: { [key: string]: ProjectStats } = {};
      for (const project of projects) {
        try {
          const [expenses, budgetCategories, teamMembers] = await Promise.all([
            apiClient.getExpenses({ project_id: project.id }),
            apiClient.getBudgetCategories(project.id),
            apiClient.get(`/api/project-teams?project_id=${project.id}`)
          ]);
          
          const totalBudget = Array.isArray(budgetCategories) ? budgetCategories.reduce((sum: number, cat: any) => sum + parseFloat(cat.allocated_amount || 0), 0) : 0;
          const spentAmount = Array.isArray(expenses) ? expenses.reduce((sum: number, exp: any) => 
            exp.status === 'approved' ? sum + parseFloat(exp.amount || 0) : sum, 0) : 0;
          const pendingExpenses = Array.isArray(expenses) ? expenses.filter((exp: any) => exp.status === 'pending').length : 0;
          
          stats[project.id] = {
            totalBudget,
            spentAmount,
            pendingExpenses,
            teamMembers: teamMembers.project_teams?.length || 0
          };
        } catch (error) {
          console.error(`Error fetching stats for project ${project.id}:`, error);
        }
      }
      setProjectStats(stats);
    } catch (error) {
      console.error('Error fetching admin projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin projects',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'planning': return <Clock className="h-4 w-4" />;
      case 'on-hold': return <AlertCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getBudgetUtilization = (spent: number, total: number) => {
    if (total === 0) return 0;
    return (spent / total) * 100;
  };

  const getBudgetUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Project Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Manage and monitor projects where you have administrative access
          </p>
        </div>
      </div>

      {adminProjects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No Admin Projects
            </h3>
            <p className="text-gray-500 mb-4">
              You don't have administrative access to any projects yet.
            </p>
            <Button onClick={() => navigate('/')}>
              Browse Projects
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminProjects.map((project) => {
            const stats = projectStats[project.id];
            const budgetUtilization = stats ? getBudgetUtilization(stats.spentAmount, stats.totalBudget) : 0;
            
            return (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {project.description || 'No description available'}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(project.status)}
                        {project.status}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Project Dates */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(project.start_date).toLocaleDateString()} - 
                      {new Date(project.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {/* Admin Since */}
                  <div className="text-xs text-gray-500">
                    Admin since: {new Date(project.admin_since).toLocaleDateString()}
                  </div>
                  
                  {/* Project Stats */}
                  {stats && (
                    <div className="space-y-3">
                      {/* Budget Overview */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">Budget</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">
                            {formatCurrency(stats.spentAmount)} / {formatCurrency(stats.totalBudget)}
                          </div>
                          <div className={`text-xs ${getBudgetUtilizationColor(budgetUtilization)}`}>
                            {budgetUtilization.toFixed(1)}% used
                          </div>
                        </div>
                      </div>
                      
                      {/* Budget Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            budgetUtilization >= 90 ? 'bg-red-500' :
                            budgetUtilization >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                        ></div>
                      </div>
                      
                      {/* Team and Pending Expenses */}
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span>{stats.teamMembers} members</span>
                        </div>
                        {stats.pendingExpenses > 0 && (
                          <div className="flex items-center gap-1 text-orange-600">
                            <AlertCircle className="h-4 w-4" />
                            <span>{stats.pendingExpenses} pending</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate('/')}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      View Project
                    </Button>
                    
                    <Dialog 
                      open={isManagementDialogOpen && selectedProject?.id === project.id} 
                      onOpenChange={(open) => {
                        setIsManagementDialogOpen(open);
                        if (!open) setSelectedProject(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedProject(project)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Manage Project: {project.name}</DialogTitle>
                          <DialogDescription>
                            Manage administrative settings and permissions for this project
                          </DialogDescription>
                        </DialogHeader>
                        {selectedProject && (
                          <ProjectAdminManagement 
                            projectId={selectedProject.id} 
                            projectName={selectedProject.name}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}