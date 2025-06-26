
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Building2, 
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Eye,
  X
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  description: string;
  icon: React.ReactNode;
  color: string;
  progress?: number;
  onClick?: () => void;
  detailData?: any[];
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend,
  description,
  icon,
  color,
  progress,
  onClick,
  detailData
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 bg-green-50';
    if (trend === 'down') return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <Card 
      className={`border-0 shadow-lg bg-card hover:shadow-xl transition-all duration-300 group ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${color} group-hover:scale-110 transition-transform duration-200`}>
              {icon}
            </div>
            {onClick && (
              <div className="p-1 rounded-full bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Eye className="h-3 w-3 text-gray-600" />
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <div className="flex items-center space-x-1">
                {getTrendIcon()}
                <Badge variant="outline" className={getTrendColor()}>
                  {change}
                </Badge>
              </div>
            )}
          </div>
          
          {progress !== undefined && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">{Math.round(progress * 10) / 10}% complete</p>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export const DashboardMetrics: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailedData, setDetailedData] = useState<any>({});

  useEffect(() => {
    fetchDashboardData();
    fetchDetailedData();
  }, []);

  const fetchDetailedData = async () => {
    try {
      // Fetch projects for detailed breakdown
      const projectsResponse = await apiClient.getProjects();
      const projects = Array.isArray(projectsResponse) ? projectsResponse : projectsResponse?.data || [];
      
      // Fetch expenses for risk alerts
      const expensesResponse = await apiClient.request('/api/expenses?limit=50');
      const expenses = expensesResponse?.expenses || expensesResponse?.data || [];
      
      setDetailedData({
        projects,
        expenses,
        completedProjects: projects.filter((p: any) => p.status === 'completed'),
        delayedProjects: projects.filter((p: any) => p.status === 'delayed' || p.status === 'on_hold'),
        riskAlerts: projects.filter((p: any) => {
          const utilization = (p.spent_budget / p.total_budget) * 100;
          return utilization > 80;
        }),
        upcomingDeadlines: projects.filter((p: any) => {
          if (!p.end_date) return false;
          const endDate = new Date(p.end_date);
          const now = new Date();
          const diffTime = endDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 30 && diffDays > 0;
        })
      });
    } catch (error) {
      console.error('Error fetching detailed data:', error);
    }
  };

  const handleMetricClick = (metric: any, detailKey: string) => {
    setSelectedMetric({ ...metric, detailKey });
    setIsDialogOpen(true);
  };

  const fetchDashboardData = async () => {
    try {
      const data = await apiClient.getDashboardMetrics();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: "Total Budget",
      value: formatCurrency(dashboardData?.total_budget || 0),
      change: dashboardData?.budget_utilization ? `${dashboardData.budget_utilization.toFixed(1)}% utilized` : "0% utilized",
      trend: (dashboardData?.budget_utilization || 0) > 75 ? "up" as const : "neutral" as const,
      description: "Across all active projects",
      icon: <DollarSign className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      progress: dashboardData?.budget_utilization || 0
    },
    {
      title: "Active Projects",
      value: dashboardData?.active_projects?.toString() || "0",
      change: `${dashboardData?.total_projects || 0} total`,
      trend: (dashboardData?.active_projects || 0) > 0 ? "up" as const : "neutral" as const,
      description: "Currently in progress",
      icon: <Building2 className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-r from-green-500 to-green-600",
      progress: dashboardData?.total_projects > 0 ? (dashboardData.active_projects / dashboardData.total_projects * 100) : 0
    },
    {
      title: "Total Spent",
      value: formatCurrency(dashboardData?.total_spent || 0),
      change: `of ${formatCurrency(dashboardData?.total_budget || 0)}`,
      trend: (dashboardData?.budget_utilization || 0) < 90 ? "up" as const : "down" as const,
      description: "Budget consumption",
      icon: <Target className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-r from-purple-500 to-purple-600",
      progress: dashboardData?.budget_utilization || 0
    },
    {
      title: "Budget Utilization",
      value: `${(dashboardData?.budget_utilization || 0).toFixed(1)}%`,
      change: dashboardData?.budget_utilization > 75 ? "High utilization" : "Good utilization",
      trend: (dashboardData?.budget_utilization || 0) > 90 ? "down" as const : "up" as const,
      description: "Overall performance",
      icon: <Target className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-r from-orange-500 to-orange-600",
      progress: dashboardData?.budget_utilization || 0
    },
    {
      title: "Completed Projects",
      value: dashboardData?.completed_projects?.toString() || "0",
      change: `${dashboardData?.on_hold_projects || 0} on hold`,
      trend: (dashboardData?.completed_projects || 0) > 0 ? "up" as const : "neutral" as const,
      description: "Successfully finished",
      icon: <CheckCircle2 className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-r from-yellow-500 to-yellow-600",
      progress: dashboardData?.total_projects > 0 ? Math.round((dashboardData.completed_projects / dashboardData.total_projects * 100) * 10) / 10 : 0,
      onClick: () => handleMetricClick({
        title: "Completed Projects",
        value: dashboardData?.completed_projects || 0,
        description: "Successfully finished projects"
      }, 'completedProjects')
    },
    {
      title: "Delayed Projects",
      value: dashboardData?.delayed_projects?.toString() || "0",
      change: dashboardData?.delayed_projects > 0 ? "Needs attention" : "On schedule",
      trend: (dashboardData?.delayed_projects || 0) > 0 ? "down" as const : "up" as const,
      description: "Past due date",
      icon: <AlertTriangle className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-r from-red-500 to-red-600",
      progress: dashboardData?.total_projects > 0 ? Math.round((dashboardData.delayed_projects / dashboardData.total_projects * 100) * 10) / 10 : 0,
      onClick: () => handleMetricClick({
        title: "Delayed Projects",
        value: dashboardData?.delayed_projects || 0,
        description: "Projects that are behind schedule"
      }, 'delayedProjects')
    },
    {
      title: "Risk Alerts",
      value: detailedData?.riskAlerts?.length?.toString() || "0",
      change: detailedData?.riskAlerts?.length > 0 ? `${detailedData.riskAlerts.length} alerts` : "No alerts",
      trend: (detailedData?.riskAlerts?.length || 0) > 0 ? "up" as const : "neutral" as const,
      description: "Projects over budget",
      icon: <AlertTriangle className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-r from-red-500 to-red-600",
      progress: dashboardData?.total_projects > 0 ? Math.round(((detailedData?.riskAlerts?.length || 0) / dashboardData.total_projects * 100) * 10) / 10 : 0,
      onClick: () => handleMetricClick({
        title: "Risk Alerts",
        value: detailedData?.riskAlerts?.length || 0,
        description: "Projects with budget utilization over 80%"
      }, 'riskAlerts')
    },
    {
      title: "Upcoming Deadlines",
      value: detailedData?.upcomingDeadlines?.length?.toString() || "0",
      change: "Next 30 days",
      trend: "neutral" as const,
      description: "Project milestones",
      icon: <Calendar className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-r from-indigo-500 to-indigo-600",
      progress: dashboardData?.total_projects > 0 ? Math.round(((detailedData?.upcomingDeadlines?.length || 0) / dashboardData.total_projects * 100) * 10) / 10 : 0,
      onClick: () => handleMetricClick({
        title: "Upcoming Deadlines",
        value: detailedData?.upcomingDeadlines?.length || 0,
        description: "Projects with deadlines in the next 30 days"
      }, 'upcomingDeadlines')
    }
  ];

  const renderDetailContent = () => {
    if (!selectedMetric || !detailedData[selectedMetric.detailKey]) return null;

    const data = detailedData[selectedMetric.detailKey];
    
    // Special rendering for Completed Projects and Delayed Projects
    if (selectedMetric.detailKey === 'completedProjects' || selectedMetric.detailKey === 'delayedProjects') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{selectedMetric.value}</p>
              <p className="text-sm text-gray-600">Total Count</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {dashboardData?.total_projects > 0 ? 
                  Math.round(((selectedMetric.value / dashboardData.total_projects) * 100) * 10) / 10 : 0}%
              </p>
              <p className="text-sm text-gray-600">of Total Projects</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedMetric.detailKey === 'completedProjects' ? 'Completed Projects List:' : 'Delayed Projects List:'}
            </h3>
            
            {data.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {selectedMetric.detailKey === 'completedProjects' 
                    ? 'No completed projects found.' 
                    : 'No delayed projects found.'}
                </p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {data.map((project: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-lg">{project.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge 
                              variant="outline" 
                              className={selectedMetric.detailKey === 'completedProjects' 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-red-50 text-red-700 border-red-200'}
                            >
                              {project.status}
                            </Badge>
                            {project.total_budget && (
                              <span className="text-sm text-gray-600">
                                Budget: {formatCurrency(project.total_budget)}
                              </span>
                            )}
                            {project.end_date && (
                              <span className="text-sm text-gray-600">
                                {selectedMetric.detailKey === 'completedProjects' ? 'Completed:' : 'Due:'} {new Date(project.end_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          {selectedMetric.detailKey === 'completedProjects' ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                          ) : (
                            <Clock className="h-6 w-6 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // Default rendering for other metrics
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{selectedMetric.value}</p>
            <p className="text-sm text-gray-600">Total Count</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {dashboardData?.total_projects > 0 ? 
                Math.round(((selectedMetric.value / dashboardData.total_projects) * 100) * 10) / 10 : 0}%
            </p>
            <p className="text-sm text-gray-600">Percentage</p>
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {data.map((item: any, index: number) => (
              <div key={index} className="p-3 border rounded-lg bg-white hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Status: <Badge variant="outline">{item.status}</Badge>
                    </p>
                    {item.total_budget && (
                      <p className="text-sm text-gray-600 mt-1">
                        Budget: {formatCurrency(item.total_budget)} | 
                        Spent: {formatCurrency(item.spent_budget || 0)} |
                        Utilization: {Math.round(((item.spent_budget || 0) / item.total_budget * 100) * 10) / 10}%
                      </p>
                    )}
                    {item.end_date && (
                      <p className="text-sm text-gray-600 mt-1">
                        Deadline: {new Date(item.end_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>{selectedMetric?.title}</span>
            </DialogTitle>
            <DialogDescription>
              {selectedMetric?.description}
            </DialogDescription>
          </DialogHeader>
          {renderDetailContent()}
        </DialogContent>
      </Dialog>
    </>
  );
};
