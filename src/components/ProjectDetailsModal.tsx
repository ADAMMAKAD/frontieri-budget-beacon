
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, DollarSign, Users, Building2, Target, Clock } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  total_budget: number;
  spent_budget: number;
  allocated_budget?: number;
  start_date?: string;
  end_date?: string;
  department?: string;
  team_id?: string;
  project_manager_id?: string;
  created_at: string;
}

interface ProjectDetailsModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  project,
  isOpen,
  onClose,
  projectName
}) => {
  const { formatCurrency } = useCurrency();

  if (!project && !projectName) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBudgetUtilization = () => {
    if (!project || !project.total_budget) return 0;
    return (project.spent_budget / project.total_budget) * 100;
  };

  const getBudgetStatusColor = () => {
    const utilization = getBudgetUtilization();
    if (utilization < 80) return 'text-green-600';
    if (utilization < 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTimeProgress = () => {
    if (!project?.start_date || !project?.end_date) return 0;
    const start = new Date(project.start_date);
    const end = new Date(project.end_date);
    const now = new Date();
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span>{project?.name || projectName}</span>
          </DialogTitle>
          <DialogDescription>
            {project ? 'Complete project details and budget information' : 'Project information'}
          </DialogDescription>
        </DialogHeader>

        {project ? (
          <div className="space-y-6">
            {/* Project Status and Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Project Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status.replace('-', ' ').toUpperCase()}
                  </Badge>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mt-2">{project.description}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Department</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{project.department || 'Not specified'}</p>
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Budget Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span>Budget Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                    <p className="text-2xl font-bold">{formatCurrency(project.total_budget)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Spent Amount</p>
                    <p className={`text-2xl font-bold ${getBudgetStatusColor()}`}>
                      {formatCurrency(project.spent_budget)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Remaining</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(project.total_budget - project.spent_budget)}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Budget Utilization</span>
                    <span className={getBudgetStatusColor()}>
                      {getBudgetUtilization().toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={getBudgetUtilization()} 
                    className="h-3"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Timeline Information */}
            {project.start_date && project.end_date && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CalendarDays className="h-5 w-5 text-blue-600" />
                    <span>Project Timeline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                      <p className="font-medium">{new Date(project.start_date).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">End Date</p>
                      <p className="font-medium">{new Date(project.end_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Time Progress</span>
                      <span>{getTimeProgress().toFixed(1)}%</span>
                    </div>
                    <Progress value={getTimeProgress()} className="h-3" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">Project details not available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
