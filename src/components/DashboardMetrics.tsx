
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
  Calendar
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
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend,
  description,
  icon,
  color,
  progress
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
    <Card className="border-0 shadow-lg bg-card hover:shadow-xl transition-all duration-300 group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className={`p-2 rounded-lg ${color} group-hover:scale-110 transition-transform duration-200`}>
            {icon}
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
              <p className="text-xs text-muted-foreground">{progress}% complete</p>
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
      progress: dashboardData?.total_projects > 0 ? (dashboardData.completed_projects / dashboardData.total_projects * 100) : 0
    },
    {
      title: "Delayed Projects",
      value: dashboardData?.delayed_projects?.toString() || "0",
      change: dashboardData?.delayed_projects > 0 ? "Needs attention" : "On schedule",
      trend: (dashboardData?.delayed_projects || 0) > 0 ? "down" as const : "up" as const,
      description: "Past due date",
      icon: <AlertTriangle className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-r from-red-500 to-red-600",
      progress: dashboardData?.total_projects > 0 ? (dashboardData.delayed_projects / dashboardData.total_projects * 100) : 0
    },
    {
      title: "Risk Alerts",
      value: "3",
      change: "+1",
      trend: "up" as const,
      description: "Projects over budget",
      icon: <AlertTriangle className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-r from-red-500 to-red-600",
      progress: 15
    },
    {
      title: "Upcoming Deadlines",
      value: "12",
      change: "Next 30 days",
      trend: "neutral" as const,
      description: "Project milestones",
      icon: <Calendar className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-r from-indigo-500 to-indigo-600",
      progress: 60
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};
