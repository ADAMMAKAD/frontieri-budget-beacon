import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  DollarSign, 
  FileText, 
  Users, 
  AlertTriangle, 
  GitBranch,
  CheckCircle,
  Filter,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  amount?: number;
  time: string;
  icon: any;
  status: string;
  department?: string;
}

// Business units will be fetched from API

const getStatusColor = (status: string) => {
  switch (status) {
    case "approved": return "bg-green-100 text-green-800";
    case "pending": return "bg-yellow-100 text-yellow-800";
    case "warning": return "bg-red-100 text-red-800";
    case "allocated": return "bg-blue-100 text-blue-800";
    case "completed": return "bg-gray-100 text-gray-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const getIconColor = (status: string) => {
  switch (status) {
    case "approved": return "text-green-600";
    case "pending": return "text-yellow-600";
    case "warning": return "text-red-600";
    case "allocated": return "text-blue-600";
    case "completed": return "text-gray-600";
    default: return "text-gray-600";
  }
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'expense_submitted':
    case 'expense_approved':
    case 'expense_rejected':
      return FileText;
    case 'project_created':
    case 'project_updated':
      return Users;
    case 'milestone_completed':
    case 'milestone_created':
    case 'milestone_updated':
      return CheckCircle;
    case 'budget_version_created':
    case 'budget_version_approved':
      return GitBranch;
    case 'budget_alert':
      return AlertTriangle;
    case 'budget_approved':
    case 'budget_allocated':
      return DollarSign;
    default:
      return Clock;
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
};

export function RecentActivity() {
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [businessUnits, setBusinessUnits] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinessUnits();
    fetchRecentActivities();
  }, []);

  const fetchBusinessUnits = async () => {
    try {
      const data = await apiClient.getBusinessUnits();
      setBusinessUnits(data.business_units || []);
    } catch (error) {
      console.error('Error fetching business units:', error);
      // Fallback to hardcoded values if API fails
      setBusinessUnits([
        { id: '1', name: 'Elixone' },
        { id: '2', name: 'Capra' },
        { id: '3', name: 'Vasta' },
        { id: '4', name: 'WASH' }
      ]);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      setLoading(true);
      
      // Fetch recent expenses with more details
      const expensesResponse = await apiClient.request('/api/expenses?limit=15&page=1');
      const expenses = expensesResponse?.expenses || expensesResponse?.data || [];
      
      // Fetch recent projects
      const projectsResponse = await apiClient.getProjects();
      const projects = Array.isArray(projectsResponse) ? projectsResponse : projectsResponse?.data || [];
      
      // Fetch recent milestones
      const milestonesResponse = await apiClient.request('/api/project-milestones?limit=10&page=1');
      const milestones = milestonesResponse?.milestones || milestonesResponse?.data || [];
      
      // Fetch budget versions
      const budgetVersionsResponse = await apiClient.request('/api/budget-versions?limit=5&page=1');
      const budgetVersions = budgetVersionsResponse?.versions || budgetVersionsResponse?.data || [];
      
      const allActivities: Activity[] = [];
      
      // Process expenses with enhanced information
      const businessUnitNames = businessUnits.map(unit => unit.name);
      expenses.forEach((expense: any) => {
        if (businessUnitNames.includes(expense.project_name || expense.department)) {
          const statusText = expense.status === 'pending' ? 'Submitted' : 
                           expense.status === 'approved' ? 'Approved' : 
                           expense.status === 'rejected' ? 'Rejected' : expense.status;
          
          allActivities.push({
            id: `expense-${expense.id}`,
            type: `expense_${expense.status}`,
            title: `Expense ${statusText}`,
            description: `${expense.description} - ${expense.project_name || 'Unknown Project'}`,
            amount: parseFloat(expense.amount),
            time: formatTimeAgo(expense.updated_at || expense.created_at),
            icon: getActivityIcon(`expense_${expense.status}`),
            status: expense.status,
            department: expense.project_name || expense.department
          });
        }
      });
      
      // Process projects with budget updates
      projects.slice(0, 8).forEach((project: any) => {
        if (businessUnitNames.includes(project.department)) {
          const budgetUtilization = project.total_budget > 0 ? 
            Math.round((project.spent_budget / project.total_budget) * 100) : 0;
          
          allActivities.push({
            id: `project-${project.id}`,
            type: 'project_updated',
            title: 'Budget Update',
            description: `${project.name} - ${budgetUtilization}% utilized`,
            amount: project.total_budget ? parseFloat(project.total_budget) : undefined,
            time: formatTimeAgo(project.updated_at || project.created_at),
            icon: getActivityIcon('project_updated'),
            status: budgetUtilization > 90 ? 'critical' : budgetUtilization > 75 ? 'warning' : 'active',
            department: project.department
          });
        }
      });
      
      // Process milestones
      milestones.forEach((milestone: any) => {
        const project = projects.find(p => p.id === milestone.project_id);
        if (project && businessUnitNames.includes(project.department)) {
          allActivities.push({
            id: `milestone-${milestone.id}`,
            type: `milestone_${milestone.status}`,
            title: `Milestone ${milestone.status === 'completed' ? 'Completed' : 
                              milestone.status === 'in_progress' ? 'In Progress' : 
                              milestone.status === 'overdue' ? 'Overdue' : 'Updated'}`,
            description: `${milestone.title} - ${project.name}`,
            amount: undefined,
            time: formatTimeAgo(milestone.updated_at || milestone.created_at),
            icon: getActivityIcon(`milestone_${milestone.status}`),
            status: milestone.status,
            department: project.department
          });
        }
      });
      
      // Process budget versions
      budgetVersions.forEach((version: any) => {
        const project = projects.find(p => p.id === version.project_id);
        if (project && businessUnitNames.includes(project.department)) {
          allActivities.push({
            id: `budget-version-${version.id}`,
            type: `budget_version_${version.status}`,
            title: `Budget ${version.status === 'approved' ? 'Approved' : 
                             version.status === 'pending' ? 'Submitted' : 'Updated'}`,
            description: `${version.version_name} - ${project.name}`,
            amount: version.total_budget ? parseFloat(version.total_budget) : undefined,
            time: formatTimeAgo(version.updated_at || version.created_at),
            icon: getActivityIcon(`budget_version_${version.status}`),
            status: version.status,
            department: project.department
          });
        }
      });
      
      // Sort by most recent and limit to 10 items
      const sortedActivities = allActivities
        .sort((a, b) => {
          // Convert time strings to dates for proper sorting
          const getTimeValue = (timeStr: string) => {
            if (timeStr === 'Just now') return new Date().getTime();
            if (timeStr.includes('minutes ago')) {
              const minutes = parseInt(timeStr.split(' ')[0]);
              return new Date().getTime() - (minutes * 60 * 1000);
            }
            if (timeStr.includes('hours ago')) {
              const hours = parseInt(timeStr.split(' ')[0]);
              return new Date().getTime() - (hours * 60 * 60 * 1000);
            }
            if (timeStr.includes('days ago')) {
              const days = parseInt(timeStr.split(' ')[0]);
              return new Date().getTime() - (days * 24 * 60 * 60 * 1000);
            }
            return new Date(timeStr).getTime();
          };
          
          return getTimeValue(b.time) - getTimeValue(a.time);
        })
        .slice(0, 10);
      
      setActivities(sortedActivities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      toast({
        title: "Error",
        description: "Failed to load recent activities",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>Recent Activity</span>
          </CardTitle>
          <CardDescription>Latest budget activities and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4 p-3 rounded-lg">
                <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <span>Recent Activity</span>
        </CardTitle>
        <CardDescription>Latest budget activities and updates for {businessUnits.map(bu => bu.name).join(', ')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activities found</p>
              <p className="text-sm">Activities will appear here as they occur</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted transition-colors duration-200">
                <div className={`p-2 rounded-full bg-muted ${getIconColor(activity.status)}`}>
                  <activity.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">{activity.title}</h4>
                    <Badge variant="outline" className={getStatusColor(activity.status)}>
                      {activity.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  <div className="flex items-center justify-between">
                    {activity.amount && activity.amount > 0 && (
                      <span className="text-sm font-medium">{formatCurrency(activity.amount)}</span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">{activity.time}</span>
                  </div>
                  {activity.department && (
                    <div className="flex items-center mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {activity.department}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
