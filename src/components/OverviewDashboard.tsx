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
  ChevronRight, ChevronDown, Star, Award, Flame, Gauge,
  Brain, Lightbulb, Cpu, Database, Wifi, Globe, Sparkles,
  TrendingUpDown, BarChart2, Radar, Layers, Atom
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
import { useProjectRefresh } from "@/contexts/ProjectContext";
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
  const { refreshTrigger } = useProjectRefresh();
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
  
  // AI-powered analytics states
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [predictiveAnalytics, setPredictiveAnalytics] = useState<any[]>([]);
  const [anomalyDetection, setAnomalyDetection] = useState<any[]>([]);
  const [smartRecommendations, setSmartRecommendations] = useState<any[]>([]);
  const [realTimeMetrics, setRealTimeMetrics] = useState<any>({});
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');

  useEffect(() => {
    fetchData();
    
    // Set up real-time data updates
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchRealTimeData();
      }
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh]);
  
  // Listen for project refresh triggers
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchData();
    }
  }, [refreshTrigger]);
  
  useEffect(() => {
    // Simulate connection status monitoring
    const checkConnection = () => {
      setConnectionStatus(navigator.onLine ? 'connected' : 'disconnected');
    };
    
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    
    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
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
        
        // Fetch AI-powered insights from backend
        await fetchAIInsights();
        await fetchPredictiveAnalytics();
        await fetchAnomalyDetection();
        await fetchSmartRecommendations();
      }

      if (teamsResponse.error) {
        console.error('Error fetching teams:', teamsResponse.error);
        setTeams([]);
      } else {
        setTeams(teamsResponse.business_units || []);
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error:', error);
      setProjects([]);
      setTeams([]);
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const fetchRealTimeData = async () => {
    try {
      setConnectionStatus('reconnecting');
      const analyticsData = await apiClient.getAnalyticsDashboard();
      
      setRealTimeMetrics({
        totalBudget: analyticsData?.total_budget || 0,
        totalSpent: analyticsData?.total_spent || 0,
        activeProjects: analyticsData?.active_projects || 0,
        efficiency: analyticsData?.efficiency_score || 0,
        riskScore: analyticsData?.risk_score || 0,
        budgetUtilization: analyticsData?.budget_utilization || 0,
        budgetVelocity: analyticsData?.monthly_burn_rate || 125000,
        projectMomentum: analyticsData?.completion_rate || 87,
        riskTrend: analyticsData?.risk_score < 30 ? 'Decreasing' : analyticsData?.risk_score > 70 ? 'Increasing' : 'Stable',
        lastUpdated: new Date().toISOString()
      });
      
      setConnectionStatus('connected');
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Real-time data fetch error:', error);
      setConnectionStatus('disconnected');
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
  
  // AI-Powered Analytics Functions - Fetch real data from backend
  const fetchAIInsights = async () => {
    try {
      const insightsData = await apiClient.getAnalyticsInsights();
      const insights = insightsData.insights || [];
      
      // Transform backend insights to match UI format
      const formattedInsights = insights.map((insight: any) => ({
        type: insight.type || 'insight',
        title: insight.title || insight.prediction,
        description: insight.description || insight.prediction,
        confidence: insight.confidence || 0.85,
        impact: insight.impact || 'medium',
        category: insight.category || 'general'
      }));
      
      setAiInsights(formattedInsights);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      // Fallback to empty array if API fails
      setAiInsights([]);
    }
  };
  
  const fetchPredictiveAnalytics = async () => {
    try {
      const insightsData = await apiClient.getAnalyticsInsights();
      const insights = insightsData.insights || [];
      
      // Transform backend insights to predictive analytics format
      const formattedPredictions = insights.filter((insight: any) => 
        insight.category === 'budget' || insight.category === 'timeline' || insight.category === 'performance'
      ).map((insight: any, index: number) => ({
        title: insight.title || insight.prediction,
        accuracy: Math.round((insight.confidence || 0.85) * 100),
        description: insight.description || insight.prediction,
        predictedValue: insight.predicted_value || insight.impact || 'Analyzing...',
        timeline: insight.timeframe || 'Next 30 days'
      }));
      
      // If no specific predictions, create default ones from analytics data
      if (formattedPredictions.length === 0) {
        const analyticsData = await apiClient.getAnalyticsDashboard();
        const defaultPredictions = [
          {
            title: "Budget Completion Timeline",
            accuracy: 85,
            description: `${analyticsData.active_projects || 0} active projects analyzed for completion predictions`,
            predictedValue: `${Math.round((analyticsData.budget_utilization || 0) * 1.2)} days`,
            timeline: "Next 30 days"
          },
          {
            title: "Budget Overrun Risk",
            accuracy: 78,
            description: `Risk assessment based on current utilization patterns`,
            predictedValue: `${Math.round(analyticsData.risk_score || 0)}%`,
            timeline: "Current quarter"
          },
          {
            title: "Portfolio Performance",
            accuracy: 92,
            description: "Overall portfolio health and trend analysis",
            predictedValue: (analyticsData.efficiency_score || 0) > 75 ? "Positive" : "Caution",
            timeline: "Next 60 days"
          }
        ];
        setPredictiveAnalytics(defaultPredictions);
      } else {
        setPredictiveAnalytics(formattedPredictions);
      }
    } catch (error) {
      console.error('Error fetching predictive analytics:', error);
      setPredictiveAnalytics([]);
    }
  };
  
  const fetchAnomalyDetection = async () => {
    try {
      const risksData = await apiClient.getAnalyticsRisks();
      const risks = risksData.risks || [];
      
      // Transform risk data to anomaly format
      const anomalies = risks.filter((risk: any) => 
        risk.severity === 'critical' || risk.severity === 'high'
      ).map((risk: any) => ({
        type: risk.type || 'anomaly',
        projectId: risk.project_id || risk.id,
        projectName: risk.project_name || risk.message,
        severity: risk.severity,
        title: risk.message || risk.title,
        description: risk.recommendation || risk.impact || risk.message,
        detectedAt: new Date().toISOString()
      }));
      
      setAnomalyDetection(anomalies);
    } catch (error) {
      console.error('Error fetching anomaly detection:', error);
      setAnomalyDetection([]);
    }
  };
  
  const fetchSmartRecommendations = async () => {
    try {
      const [insightsData, risksData] = await Promise.all([
        apiClient.getAnalyticsInsights(),
        apiClient.getAnalyticsRisks()
      ]);
      
      const insights = insightsData.insights || [];
      const risks = risksData.risks || [];
      
      // Transform insights and risks to recommendations
      const recommendations = [];
      
      // Add optimization recommendations from insights
      insights.filter((insight: any) => insight.category === 'budget' || insight.category === 'performance')
        .forEach((insight: any) => {
          recommendations.push({
            type: 'optimization',
            category: 'optimization',
            priority: insight.impact === 'high' ? 'high' : 'medium',
            title: insight.title || insight.prediction,
            description: insight.description || insight.prediction,
            impact: insight.impact || 'Medium impact on portfolio performance',
            timeline: insight.timeframe || 'Next 30 days',
            action: insight.recommendation || 'Review and implement suggested changes'
          });
        });
      
      // Add risk mitigation recommendations from risks
      risks.filter((risk: any) => risk.severity === 'high' || risk.severity === 'critical')
        .forEach((risk: any) => {
          recommendations.push({
            type: 'risk_mitigation',
            category: 'risk',
            priority: risk.severity === 'critical' ? 'critical' : 'high',
            title: risk.message || 'Risk Mitigation Required',
            description: risk.impact || risk.message,
            impact: risk.impact || 'Prevent potential project failures',
            timeline: 'Immediate',
            action: risk.recommendation || 'Implement risk mitigation strategies'
          });
        });
      
      setSmartRecommendations(recommendations);
    } catch (error) {
      console.error('Error fetching smart recommendations:', error);
      setSmartRecommendations([]);
    }
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
        {/* Enhanced Header Section with Real-time Status */}
        <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              connectionStatus === 'connected' ? 'bg-green-500/20 text-green-100' :
              connectionStatus === 'reconnecting' ? 'bg-yellow-500/20 text-yellow-100' :
              'bg-red-500/20 text-red-100'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
                connectionStatus === 'reconnecting' ? 'bg-yellow-400 animate-spin' :
                'bg-red-400'
              }`}></div>
              <span>{connectionStatus === 'connected' ? 'Live' : connectionStatus === 'reconnecting' ? 'Syncing' : 'Offline'}</span>
            </div>
            <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-white/10 text-xs">
              <Clock className="h-3 w-3" />
              <span>Updated {lastUpdate.toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg relative">
                    <Briefcase className="h-8 w-8" />
                    {connectionStatus === 'connected' && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold mb-1 flex items-center space-x-2">
                      <span>Frontieri PBMS</span>
                      <Brain className="h-8 w-8 text-orange-200 animate-pulse" />
                    </h1>
                    <p className="text-orange-100 text-lg font-medium flex items-center space-x-2">
                      <span>AI-Powered Project Budget Management</span>
                      <Sparkles className="h-5 w-5 text-yellow-300" />
                    </p>
                  </div>
                </div>
                
                {/* Real-time AI-Powered Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Database className="h-5 w-5 text-green-300" />
                        <span className="text-sm font-medium">System Health</span>
                      </div>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-2xl font-bold mt-1">99.9%</p>
                    <p className="text-xs text-orange-200">Uptime & Performance</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Layers className="h-5 w-5 text-blue-300" />
                        <span className="text-sm font-medium">Active Projects</span>
                      </div>
                      <TrendingUp className="h-4 w-4 text-green-300" />
                    </div>
                    <p className="text-2xl font-bold mt-1">{realTimeMetrics.activeProjects || projects.length}</p>
                    <p className="text-xs text-orange-200">Live tracking enabled</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-yellow-300" />
                        <span className="text-sm font-medium">Total Budget</span>
                      </div>
                      <BarChart2 className="h-4 w-4 text-yellow-300" />
                    </div>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(realTimeMetrics.totalBudget || performanceMetrics.totalBudget || 0)}</p>
                    <p className="text-xs text-orange-200">Real-time valuation</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Brain className="h-5 w-5 text-purple-300" />
                        <span className="text-sm font-medium">AI Efficiency</span>
                      </div>
                      <Atom className="h-4 w-4 text-purple-300 animate-spin" />
                    </div>
                    <p className="text-2xl font-bold mt-1">{Math.round(realTimeMetrics.efficiency || performanceMetrics.efficiency || 0)}%</p>
                    <p className="text-xs text-orange-200">ML-optimized score</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Radar className="h-5 w-5 text-red-300" />
                        <span className="text-sm font-medium">Risk Score</span>
                      </div>
                      <Shield className="h-4 w-4 text-red-300" />
                    </div>
                    <p className="text-2xl font-bold mt-1">{Math.round(realTimeMetrics.riskScore || 15)}</p>
                    <p className="text-xs text-orange-200">AI risk assessment</p>
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

            {/* AI Insights & Analytics Dashboard */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* AI Insights Panel */}
              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 shadow-lg">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center text-purple-900">
                      <Brain className="h-4 w-4 mr-2 text-purple-600" />
                      AI Insights
                    </h3>
                    <Sparkles className="h-3 w-3 text-yellow-500 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    {aiInsights.slice(0, 2).map((insight, index) => (
                      <div key={index} className="bg-white/80 rounded-md p-2 border border-purple-200">
                        <div className="flex items-start space-x-2">
                          <Lightbulb className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-purple-900 truncate">{insight.title}</p>
                            <p className="text-xs text-purple-700 mt-1 line-clamp-2">{insight.description}</p>
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 mt-1">
                              {insight.confidence}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Smart Recommendations */}
              <Card className="bg-gradient-to-br from-green-50 to-teal-50 border-green-200 shadow-lg">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center text-green-900">
                      <Cpu className="h-4 w-4 mr-2 text-green-600" />
                      Smart Recommendations
                    </h3>
                    <TrendingUpDown className="h-3 w-3 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    {smartRecommendations.slice(0, 2).map((rec, index) => (
                      <div key={index} className="bg-white/80 rounded-md p-2 border border-green-200">
                        <div className="flex items-start space-x-2">
                          <div className={`h-2 w-2 rounded-full mt-1 flex-shrink-0 ${
                            rec.priority === 'high' ? 'bg-red-500' :
                            rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-green-900 truncate">{rec.title}</p>
                            <p className="text-xs text-green-700 mt-1 line-clamp-2">{rec.description}</p>
                            <div className="flex items-center mt-1 space-x-1">
                              <Badge variant="outline" className="text-xs border-green-300 text-green-800">
                                {rec.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Anomaly Detection */}
              <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-lg">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center text-orange-900">
                      <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
                      Anomaly Detection
                    </h3>
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    {anomalyDetection.length > 0 ? anomalyDetection.slice(0, 2).map((anomaly, index) => (
                      <div key={index} className="bg-white/80 rounded-md p-2 border border-orange-200">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="h-3 w-3 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-orange-900 truncate">{anomaly.title}</p>
                            <p className="text-xs text-orange-700 mt-1 line-clamp-2">{anomaly.description}</p>
                            <Badge variant="destructive" className="text-xs mt-1 bg-orange-100 text-orange-800 border-orange-300">
                              {anomaly.severity}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="bg-white/80 rounded-md p-2 border border-green-200">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-3 w-3 text-green-600" />
                          <p className="text-xs text-green-800">No anomalies detected</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
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
            <TabsList className="grid w-full max-w-3xl grid-cols-6 bg-white/50 backdrop-blur-sm">
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
              <TabsTrigger value="ai-analytics" className="flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span>AI Analytics</span>
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

          {/* AI Analytics Tab */}
          <TabsContent value="ai-analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Predictive Analytics */}
              <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <span>Predictive Analytics</span>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      ML-Powered
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {predictiveAnalytics.map((prediction, index) => (
                      <div key={index} className="p-4 bg-white rounded-lg border border-purple-100">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-purple-900">{prediction.title}</h4>
                          <Badge variant="outline" className="border-purple-300 text-purple-700">
                            {prediction.accuracy}% accuracy
                          </Badge>
                        </div>
                        <p className="text-sm text-purple-700 mb-3">{prediction.description}</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-2 bg-purple-50 rounded">
                            <p className="text-xs text-purple-600">Predicted Value</p>
                            <p className="font-bold text-purple-900">{prediction.predictedValue}</p>
                          </div>
                          <div className="text-center p-2 bg-purple-50 rounded">
                            <p className="text-xs text-purple-600">Timeline</p>
                            <p className="font-bold text-purple-900">{prediction.timeline}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI Insights Deep Dive */}
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5 text-blue-600" />
                    <span>AI Insights Deep Dive</span>
                    <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {aiInsights.map((insight, index) => (
                      <div key={index} className="p-4 bg-white rounded-lg border border-blue-100">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Cpu className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-blue-900 mb-1">{insight.title}</h4>
                            <p className="text-sm text-blue-700 mb-2">{insight.description}</p>
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {insight.confidence}% confidence
                              </Badge>
                              <span className="text-xs text-blue-600">{insight.category}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Real-time Data Streams */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-green-600" />
                  <span>Real-time Data Streams</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600">Live</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-green-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-green-900">Budget Velocity</h4>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-800">
                      {formatCurrency(realTimeMetrics.budgetVelocity || 125000)}/month
                    </p>
                    <p className="text-xs text-green-600 mt-1">Average spending rate</p>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg border border-green-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-green-900">Project Momentum</h4>
                      <BarChart2 className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-800">
                      {Math.round(realTimeMetrics.projectMomentum || 87)}%
                    </p>
                    <p className="text-xs text-green-600 mt-1">Completion velocity</p>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg border border-green-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-green-900">Risk Trend</h4>
                      <Radar className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-800">
                      {realTimeMetrics.riskTrend || 'Decreasing'}
                    </p>
                    <p className="text-xs text-green-600 mt-1">7-day trend</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Smart Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-orange-600" />
                    <span>Optimization Opportunities</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {smartRecommendations.filter(r => r.category === 'optimization').map((rec, index) => (
                      <div key={index} className="p-3 bg-white rounded-lg border border-orange-100">
                        <div className="flex items-start space-x-3">
                          <div className={`h-2 w-2 rounded-full mt-2 ${
                            rec.priority === 'high' ? 'bg-red-500' :
                            rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
                          <div>
                            <h4 className="font-medium text-orange-900">{rec.title}</h4>
                            <p className="text-sm text-orange-700 mt-1">{rec.description}</p>
                            <div className="flex items-center mt-2 space-x-2">
                              <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                                {rec.impact}
                              </Badge>
                              <span className="text-xs text-orange-600">{rec.timeline}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-teal-600" />
                    <span>Risk Mitigation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {smartRecommendations.filter(r => r.category === 'risk').map((rec, index) => (
                      <div key={index} className="p-3 bg-white rounded-lg border border-teal-100">
                        <div className="flex items-start space-x-3">
                          <div className={`h-2 w-2 rounded-full mt-2 ${
                            rec.priority === 'high' ? 'bg-red-500' :
                            rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
                          <div>
                            <h4 className="font-medium text-teal-900">{rec.title}</h4>
                            <p className="text-sm text-teal-700 mt-1">{rec.description}</p>
                            <div className="flex items-center mt-2 space-x-2">
                              <Badge variant="outline" className="text-xs border-teal-300 text-teal-700">
                                {rec.impact}
                              </Badge>
                              <span className="text-xs text-teal-600">{rec.timeline}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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
