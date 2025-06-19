import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle, Settings,
  BarChart3, PieChart, LineChart, Target, Calendar, Users, Clock, 
  ArrowUpRight, ArrowDownRight, Activity, Zap, Shield, Eye,
  Bell, Filter, Download, RefreshCw, MoreHorizontal, Plus,
  Briefcase, Calculator, TrendingUpIcon, AlertCircle, Info,
  ChevronRight, ChevronDown, Star, Award, Flame, Gauge
} from "lucide-react";
import { BudgetChart } from "@/components/BudgetChart";
import { EnhancedBudgetChart } from "@/components/EnhancedBudgetChart";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { ProjectFilter } from "@/components/ProjectFilter";
import { RecentActivity } from "@/components/RecentActivity";
import { ProjectDisplayControls } from "@/components/ProjectDisplayControls";
import { ProjectGridView } from "@/components/ProjectGridView";
import { ProjectListView } from "@/components/ProjectListView";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useState, useEffect } from "react";
import { apiClient } from '@/lib/api';
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Project {
  id: string;
  name: string;
  total_budget: number;
  spent_budget: number;
  status: string;
  start_date?: string;
  team_id?: string;
  currency?: string;
}

interface Team {
  id: string;
  name: string;
}

export function OverviewDashboard() {
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMore, setShowMore] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  
  // Advanced analytics states
  const [budgetForecast, setBudgetForecast] = useState<any[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>({});
  const [realTimeAlerts, setRealTimeAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [projectsResponse, teamsResponse] = await Promise.all([
        apiClient.getProjects(),
        apiClient.getBusinessUnits()
      ]);

      if (projectsResponse.error) {
        console.error('Error fetching projects:', projectsResponse.error);
        setProjects([]);
      } else {
        const projectData = projectsResponse.projects || [];
        setProjects(projectData);
        
        // Generate advanced analytics
        generateBudgetForecast(projectData);
        generateRiskAssessment(projectData);
        generatePerformanceMetrics(projectData);
        generateRealTimeAlerts(projectData);
      }

      if (teamsResponse.error) {
        console.error('Error fetching teams:', teamsResponse.error);
        setTeams([]);
      } else {
        setTeams(teamsResponse.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setProjects([]);
      setTeams([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Advanced Analytics Functions - Include all active projects
  const generateBudgetForecast = (projectData: Project[]) => {
    // Include all active projects
    const activeProjects = projectData.filter(project => 
      project.status === 'active' || project.status === 'on-track'
    );
    
    const forecast = activeProjects.map(project => {
      const spentPercentage = (project.spent_budget / project.total_budget) * 100;
      const remainingBudget = project.total_budget - project.spent_budget;
      const burnRate = spentPercentage > 0 ? spentPercentage / 30 : 0; // Assuming 30 days
      const projectedCompletion = burnRate > 0 ? remainingBudget / (burnRate * project.total_budget / 100) : 0;
      
      return {
        projectId: project.id,
        projectName: project.name,
        currentSpent: project.spent_budget,
        totalBudget: project.total_budget,
        projectedSpend: project.spent_budget + (burnRate * remainingBudget),
        projectedCompletion: Math.min(projectedCompletion, 365),
        riskLevel: spentPercentage > 80 ? 'high' : spentPercentage > 60 ? 'medium' : 'low'
      };
    });
    setBudgetForecast(forecast);
  };

  const generateRiskAssessment = (projectData: Project[]) => {
    // Include all active projects
    const activeProjects = projectData.filter(project => 
      project.status === 'active' || project.status === 'on-track' || project.status === 'delayed' || project.status === 'on_hold'
    );
    
    const risks = activeProjects.map(project => {
      const spentPercentage = (project.spent_budget / project.total_budget) * 100;
      const overBudgetRisk = spentPercentage > 90 ? 'critical' : spentPercentage > 75 ? 'high' : 'low';
      const timeRisk = project.status === 'delayed' ? 'high' : 'low';
      
      return {
        projectId: project.id,
        projectName: project.name,
        overBudgetRisk,
        timeRisk,
        overallRisk: overBudgetRisk === 'critical' || timeRisk === 'high' ? 'high' : 'medium',
        recommendations: generateRecommendations(spentPercentage, project.status)
      };
    });
    setRiskAssessment(risks);
  };

  const generatePerformanceMetrics = (projectData: Project[]) => {
    // Include all active projects
    const activeProjects = projectData.filter(project => 
      project.status === 'active' || project.status === 'on-track' || project.status === 'delayed' || project.status === 'on_hold' || project.status === 'completed'
    );
    
    // Calculate total budget with currency conversion (ETB to USD rate: ~0.018)
    const exchangeRates = { USD: 1, ETB: 0.018 };
    const totalBudget = activeProjects.reduce((sum, p) => {
      const budget = p.total_budget || 0;
      const currency = (p as any).currency || 'USD';
      const rate = exchangeRates[currency as keyof typeof exchangeRates] || 1;
      return sum + (budget * rate);
    }, 0);
    
    const totalSpent = activeProjects.reduce((sum, p) => {
      const spent = p.spent_budget || 0;
      const currency = (p as any).currency || 'USD';
      const rate = exchangeRates[currency as keyof typeof exchangeRates] || 1;
      return sum + (spent * rate);
    }, 0);
    
    const avgUtilization = activeProjects.length > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const onTimeProjects = activeProjects.filter(p => p.status === 'on-track' || p.status === 'active').length;
    const delayedProjects = activeProjects.filter(p => p.status === 'on_hold' || p.status === 'delayed').length;
    const completedProjects = activeProjects.filter(p => p.status === 'completed').length;
    
    setPerformanceMetrics({
      totalBudget,
      totalSpent,
      avgUtilization,
      onTimeProjects,
      delayedProjects,
      completedProjects,
      efficiency: onTimeProjects / Math.max(activeProjects.length, 1) * 100,
      roi: totalBudget > 0 ? ((totalBudget - totalSpent) / totalBudget) * 100 : 0
    });
  };

  const generateRealTimeAlerts = (projectData: Project[]) => {
    // Include all active projects
    const activeProjects = projectData.filter(project => 
      project.status === 'active' || project.status === 'on-track' || project.status === 'delayed' || project.status === 'on_hold'
    );
    
    const alerts = [];
    
    activeProjects.forEach(project => {
      const spentPercentage = (project.spent_budget / project.total_budget) * 100;
      
      if (spentPercentage > 90) {
        alerts.push({
          id: `budget-${project.id}`,
          type: 'critical',
          title: 'Budget Overrun Alert',
          message: `${project.name} has exceeded 90% of allocated budget`,
          timestamp: new Date().toISOString()
        });
      }
      
      if (project.status === 'on_hold' || project.status === 'delayed') {
        alerts.push({
          id: `delay-${project.id}`,
          type: 'warning',
          title: 'Project Delay',
          message: `${project.name} is behind schedule`,
          timestamp: new Date().toISOString()
        });
      }
      
      if (spentPercentage > 75 && spentPercentage <= 90) {
        alerts.push({
          id: `warning-${project.id}`,
          type: 'warning',
          title: 'Budget Warning',
          message: `${project.name} approaching budget limit`,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    setRealTimeAlerts(alerts);
  };

  const generateRecommendations = (spentPercentage: number, status: string) => {
    const recommendations = [];
    
    if (spentPercentage > 80) {
      recommendations.push('Consider budget reallocation or scope reduction');
    }
    if (status === 'delayed') {
      recommendations.push('Review project timeline and resource allocation');
    }
    if (spentPercentage < 30) {
      recommendations.push('Project may be under-utilizing allocated resources');
    }
    
    return recommendations;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setSelectedYear('');
    setSelectedTeam('');
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    const matchesYear = selectedYear === 'all' || 
      (project.start_date && new Date(project.start_date).getFullYear().toString() === selectedYear);
    const matchesTeam = selectedTeam === 'all' || project.team_id === selectedTeam;

    return matchesSearch && matchesStatus && matchesYear && matchesTeam;
  });

  const displayedProjects = showMore ? filteredProjects : filteredProjects.slice(0, 9);

  const handleAdminAccess = () => {
    // Check if user email is admin@gmail.com
    if (user?.email === 'admin@gmail.com') {
      navigate('/admin');
    } else {
      // Show a message that admin access is restricted
      alert('Admin access is restricted to admin@gmail.com');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-6 space-y-6">
        {/* Enhanced Header Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Briefcase className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold mb-1">Frontieri PBMS</h1>
                    <p className="text-blue-100 text-lg font-medium">
                      Advanced Project Budget Management System
                    </p>
                  </div>
                </div>
                
                {/* Real-time System Health */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-green-300" />
                      <span className="text-sm font-medium">System Status</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">Online</p>
                    <p className="text-xs text-blue-200">All systems operational</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-blue-300" />
                      <span className="text-sm font-medium">Active Projects</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{projects.length}</p>
                    <p className="text-xs text-blue-200">Currently managed</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-yellow-300" />
                      <span className="text-sm font-medium">Total Budget</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(performanceMetrics.totalBudget || 0)}</p>
                    <p className="text-xs text-blue-200">Across all projects</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Gauge className="h-5 w-5 text-orange-300" />
                      <span className="text-sm font-medium">Efficiency</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{Math.round(performanceMetrics.efficiency || 0)}%</p>
                    <p className="text-xs text-blue-200">Project success rate</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={fetchData}
                  disabled={refreshing}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Admin Panel
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Real-time Alerts */}
            {realTimeAlerts.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Bell className="h-5 w-5 text-yellow-300" />
                  <span className="text-sm font-medium">Real-time Alerts</span>
                  <Badge variant="secondary" className="bg-red-500/20 text-red-100">
                    {realTimeAlerts.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {realTimeAlerts.slice(0, 2).map((alert) => (
                    <Alert key={alert.id} className="bg-white/10 border-white/20 text-white">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <strong>{alert.title}:</strong> {alert.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Budget Analytics - All Active Projects */}
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Advanced Budget Analytics</h2>
              <p className="text-sm text-gray-600 mt-1">
                Real-time analytics for all active projects in the system
              </p>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {projects.filter(p => p.status === 'active' || p.status === 'on-track').length} Active Projects
            </Badge>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-2xl grid-cols-5 bg-white/50 backdrop-blur-sm">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="forecast" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Forecast</span>
              </TabsTrigger>
              <TabsTrigger value="risks" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Risk Analysis</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Performance</span>
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>Projects</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-white/50">
                Last updated: {new Date().toLocaleTimeString()}
              </Badge>
            </div>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <DashboardMetrics />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <EnhancedBudgetChart />
              </div>
              <div>
                <RecentActivity />
              </div>
            </div>
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Budget Utilization</p>
                      <p className="text-3xl font-bold text-green-700">
                        {Math.round(performanceMetrics.avgUtilization || 0)}%
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <Calculator className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <Progress value={performanceMetrics.avgUtilization || 0} className="mt-3" />
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">On-Track Projects</p>
                      <p className="text-3xl font-bold text-blue-700">
                        {performanceMetrics.onTimeProjects || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <CheckCircle className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    {Math.round((performanceMetrics.onTimeProjects || 0) / Math.max(projects.length, 1) * 100)}% success rate
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Delayed Projects</p>
                      <p className="text-3xl font-bold text-orange-700">
                        {performanceMetrics.delayedProjects || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                  <p className="text-xs text-orange-600 mt-2">
                    Requires immediate attention
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">ROI Potential</p>
                      <p className="text-3xl font-bold text-purple-700">
                        {Math.round(performanceMetrics.roi || 0)}%
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-xs text-purple-600 mt-2">
                    Return on investment
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Budget Forecast Tab */}
          <TabsContent value="forecast" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <LineChart className="h-5 w-5 text-blue-600" />
                    <span>Budget Forecast Analysis</span>
                  </CardTitle>
                  <CardDescription>
                    Predictive analysis based on current spending patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {budgetForecast.slice(0, 5).map((forecast) => (
                      <div key={forecast.projectId} className="p-4 bg-white rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{forecast.projectName}</h4>
                          <Badge 
                            variant={forecast.riskLevel === 'high' ? 'destructive' : 
                                   forecast.riskLevel === 'medium' ? 'default' : 'secondary'}
                          >
                            {forecast.riskLevel} risk
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Current Spent</p>
                            <p className="font-medium">{formatCurrency(forecast.currentSpent)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Projected Total</p>
                            <p className="font-medium">{formatCurrency(forecast.projectedSpend)}</p>
                          </div>
                        </div>
                        <Progress 
                          value={(forecast.currentSpent / forecast.totalBudget) * 100} 
                          className="mt-3" 
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <span>Completion Timeline</span>
                  </CardTitle>
                  <CardDescription>
                    Estimated project completion dates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {budgetForecast.slice(0, 5).map((forecast) => (
                      <div key={forecast.projectId} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div>
                          <p className="font-medium">{forecast.projectName}</p>
                          <p className="text-sm text-muted-foreground">
                            {Math.round(forecast.projectedCompletion)} days remaining
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {new Date(Date.now() + forecast.projectedCompletion * 24 * 60 * 60 * 1000).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Est. completion</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Risk Analysis Tab */}
          <TabsContent value="risks" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-white/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span>High Risk Projects</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {riskAssessment.filter(r => r.overallRisk === 'high').map((risk) => (
                      <div key={risk.projectId} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="font-medium text-red-800">{risk.projectName}</p>
                        <div className="mt-2 space-y-1">
                          {risk.recommendations.map((rec, index) => (
                            <p key={index} className="text-xs text-red-600">• {rec}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Info className="h-5 w-5 text-yellow-600" />
                    <span>Medium Risk Projects</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {riskAssessment.filter(r => r.overallRisk === 'medium').map((risk) => (
                      <div key={risk.projectId} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="font-medium text-yellow-800">{risk.projectName}</p>
                        <div className="mt-2 space-y-1">
                          {risk.recommendations.map((rec, index) => (
                            <p key={index} className="text-xs text-yellow-600">• {rec}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Low Risk Projects</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {riskAssessment.filter(r => r.overallRisk !== 'high' && r.overallRisk !== 'medium').map((risk) => (
                      <div key={risk.projectId} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="font-medium text-green-800">{risk.projectName}</p>
                        <p className="text-xs text-green-600 mt-1">Project is on track</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-indigo-600" />
                    <span>Top Performers</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {projects
                      .filter(p => (p.spent_budget / p.total_budget) < 0.8 && p.status === 'on-track')
                      .slice(0, 3)
                      .map((project, index) => (
                        <div key={project.id} className="flex items-center space-x-3 p-2 bg-white rounded-lg">
                          <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-full">
                            <Star className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{project.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {Math.round((project.spent_budget / project.total_budget) * 100)}% utilized
                            </p>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Flame className="h-5 w-5 text-orange-600" />
                    <span>Needs Attention</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {projects
                      .filter(p => (p.spent_budget / p.total_budget) > 0.8 || p.status === 'delayed')
                      .slice(0, 3)
                      .map((project) => (
                        <div key={project.id} className="flex items-center space-x-3 p-2 bg-white rounded-lg">
                          <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{project.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {Math.round((project.spent_budget / project.total_budget) * 100)}% utilized
                            </p>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-green-600" />
                    <span>KPI Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Budget Efficiency</span>
                      <span className="font-medium">{Math.round(performanceMetrics.efficiency || 0)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Project Success Rate</span>
                      <span className="font-medium">
                        {Math.round((performanceMetrics.onTimeProjects || 0) / Math.max(projects.length, 1) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Average Utilization</span>
                      <span className="font-medium">{Math.round(performanceMetrics.avgUtilization || 0)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">ROI Potential</span>
                      <span className="font-medium">{Math.round(performanceMetrics.roi || 0)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <ProjectFilter
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              selectedTeam={selectedTeam}
              setSelectedTeam={setSelectedTeam}
              onClearFilters={clearFilters}
              teams={teams}
            />
            
            <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                  <span>Project Portfolio</span>
                  {filteredProjects.length !== projects.length && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      {filteredProjects.length} of {projects.length}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Comprehensive view of all project budgets and status</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <p>No projects found matching the current filters. Try adjusting your search criteria.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ProjectDisplayControls
                      viewMode={viewMode}
                      onViewModeChange={setViewMode}
                      showMore={showMore}
                      onShowMoreToggle={() => setShowMore(!showMore)}
                      totalProjects={filteredProjects.length}
                      displayedProjects={displayedProjects.length}
                    />
                    
                    {viewMode === 'grid' ? (
                      <ProjectGridView projects={displayedProjects} />
                    ) : (
                      <ProjectListView projects={displayedProjects} />
                    )}
                    
                    {!showMore && filteredProjects.length > 9 && (
                      <div className="text-center p-4">
                        <p className="text-sm text-muted-foreground">
                          Showing 9 of {filteredProjects.length} filtered projects
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
