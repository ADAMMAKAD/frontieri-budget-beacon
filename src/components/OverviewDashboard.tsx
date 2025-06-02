
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import { BudgetChart } from "@/components/BudgetChart";
import { RecentActivity } from "@/components/RecentActivity";

export function OverviewDashboard() {
  const budgetMetrics = [
    {
      title: "Total Budget",
      value: "$2,450,000",
      change: "+12.5%",
      trend: "up",
      description: "Across all projects"
    },
    {
      title: "Allocated Budget",
      value: "$1,890,000",
      change: "+8.2%",
      trend: "up",
      description: "77% of total budget"
    },
    {
      title: "Remaining Budget",
      value: "$560,000",
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

  const projects = [
    { name: "Project Alpha", budget: 450000, spent: 325000, status: "on-track" },
    { name: "Project Beta", budget: 680000, spent: 612000, status: "over-budget" },
    { name: "Project Gamma", budget: 320000, spent: 198000, status: "under-budget" },
    { name: "Project Delta", budget: 440000, spent: 385000, status: "on-track" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome to Frontieri PBMS</h1>
        <p className="text-blue-100 text-lg">
          Project Budget Management System - Your centralized financial control center
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {budgetMetrics.map((metric, index) => (
          <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">{metric.title}</CardTitle>
                {metric.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant={metric.trend === "up" ? "default" : "destructive"} className="text-xs">
                    {metric.change}
                  </Badge>
                  <p className="text-sm text-gray-500">{metric.description}</p>
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
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <span>Project Budget Status</span>
          </CardTitle>
          <CardDescription>Current budget allocation and spending across active projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.map((project, index) => {
              const utilization = (project.spent / project.budget) * 100;
              const getStatusColor = (status: string) => {
                switch (status) {
                  case "on-track": return "text-green-600";
                  case "over-budget": return "text-red-600";
                  case "under-budget": return "text-blue-600";
                  default: return "text-gray-600";
                }
              };
              const getStatusIcon = (status: string) => {
                switch (status) {
                  case "on-track": return <CheckCircle className="h-4 w-4 text-green-600" />;
                  case "over-budget": return <AlertTriangle className="h-4 w-4 text-red-600" />;
                  case "under-budget": return <TrendingDown className="h-4 w-4 text-blue-600" />;
                  default: return null;
                }
              };

              return (
                <div key={index} className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                      {getStatusIcon(project.status)}
                    </div>
                    <Badge variant="outline" className={getStatusColor(project.status)}>
                      {project.status.replace("-", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Budget: ${project.budget.toLocaleString()}</span>
                      <span>Spent: ${project.spent.toLocaleString()}</span>
                    </div>
                    <Progress value={utilization} className="h-2" />
                    <p className="text-xs text-gray-500">{utilization.toFixed(1)}% utilized</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
