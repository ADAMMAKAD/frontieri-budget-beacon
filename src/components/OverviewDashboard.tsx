
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import { BudgetChart } from "@/components/BudgetChart";
import { RecentActivity } from "@/components/RecentActivity";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Project {
  id: string;
  name: string;
  total_budget: number;
  spent_budget: number;
  status: string;
}

export function OverviewDashboard() {
  const { formatCurrency } = useCurrency();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, total_budget, spent_budget, status')
        .limit(4);

      if (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
      } else {
        setProjects(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const budgetMetrics = [
    {
      title: "Total Budget",
      value: formatCurrency(2450000),
      change: "+12.5%",
      trend: "up",
      description: "Across all projects"
    },
    {
      title: "Allocated Budget",
      value: formatCurrency(1890000),
      change: "+8.2%",
      trend: "up",
      description: "77% of total budget"
    },
    {
      title: "Remaining Budget",
      value: formatCurrency(560000),
      change: "-4.1%",
      trend: "down",
      description: "23% available"
    },
    {
      title: "Budget Utilization",
      value: "77%",
      change: "+5.3%",
      trend: "up",
      description: "YTD performance"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white dark:from-blue-700 dark:to-purple-700">
        <h1 className="text-3xl font-bold mb-2">Welcome to Frontieri PBMS</h1>
        <p className="text-blue-100 text-lg">
          Project Budget Management System - Your centralized financial control center
        </p>
        <div className="mt-4 p-3 bg-white/10 rounded-lg">
          <p className="text-sm text-blue-100 mb-2">🔐 <strong>Admin Access:</strong></p>
          <p className="text-xs text-blue-200">
            Create an account with email: <code className="bg-white/20 px-1 rounded">admin@gmail.com</code> and password: <code className="bg-white/20 px-1 rounded">1234567890</code> to access the Admin Dashboard
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {budgetMetrics.map((metric, index) => (
          <Card key={index} className="border-0 shadow-lg bg-card hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
                {metric.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">{metric.value}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant={metric.trend === "up" ? "default" : "destructive"} className="text-xs">
                    {metric.change}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{metric.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetChart />
        <RecentActivity />
      </div>

      {/* Project Status */}
      <Card className="border-0 shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <span>Project Budget Status</span>
          </CardTitle>
          <CardDescription>Current budget allocation and spending across active projects</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <p>No projects found. Create some projects to see budget status here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project, index) => {
                const budget = project.total_budget || 0;
                const spent = project.spent_budget || 0;
                const utilization = budget > 0 ? (spent / budget) * 100 : 0;
                
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case "active": return "text-green-600";
                    case "completed": return "text-blue-600";
                    case "on-hold": return "text-yellow-600";
                    case "cancelled": return "text-red-600";
                    default: return "text-gray-600";
                  }
                };
                
                const getStatusIcon = (status: string) => {
                  switch (status) {
                    case "active": return <CheckCircle className="h-4 w-4 text-green-600" />;
                    case "completed": return <CheckCircle className="h-4 w-4 text-blue-600" />;
                    case "on-hold": return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
                    case "cancelled": return <AlertTriangle className="h-4 w-4 text-red-600" />;
                    default: return null;
                  }
                };

                return (
                  <div key={index} className="p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{project.name}</h4>
                        {getStatusIcon(project.status)}
                      </div>
                      <Badge variant="outline" className={getStatusColor(project.status)}>
                        {project.status.replace("-", " ").toUpperCase()}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Budget: {formatCurrency(budget)}</span>
                        <span>Spent: {formatCurrency(spent)}</span>
                      </div>
                      <Progress value={utilization} className="h-2" />
                      <p className="text-xs text-muted-foreground">{utilization.toFixed(1)}% utilized</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
