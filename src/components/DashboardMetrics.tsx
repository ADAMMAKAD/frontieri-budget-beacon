
import React from 'react';
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

  const metrics = [
    {
      title: "Total Budget",
      value: formatCurrency(2450000),
      change: "+12.5%",
      trend: "up" as const,
      description: "Across all active projects",
      icon: <DollarSign className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      progress: 75
    },
    {
      title: "Active Projects",
      value: "24",
      change: "+3",
      trend: "up" as const,
      description: "Currently in progress",
      icon: <Building2 className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-r from-green-500 to-green-600",
      progress: 85
    },
    {
      title: "Team Members",
      value: "156",
      change: "+12",
      trend: "up" as const,
      description: "Across all departments",
      icon: <Users className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-r from-purple-500 to-purple-600",
      progress: 92
    },
    {
      title: "Budget Utilization",
      value: "77%",
      change: "+5.3%",
      trend: "up" as const,
      description: "Year-to-date performance",
      icon: <Target className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-r from-orange-500 to-orange-600",
      progress: 77
    },
    {
      title: "Pending Approvals",
      value: "8",
      change: "-2",
      trend: "down" as const,
      description: "Awaiting review",
      icon: <Clock className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-r from-yellow-500 to-yellow-600",
      progress: 40
    },
    {
      title: "Completed Milestones",
      value: "142",
      change: "+18",
      trend: "up" as const,
      description: "This quarter",
      icon: <CheckCircle2 className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-r from-teal-500 to-teal-600",
      progress: 88
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
