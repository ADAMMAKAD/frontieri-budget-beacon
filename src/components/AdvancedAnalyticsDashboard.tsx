import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Brain,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  DollarSign,
  Users,
  Calendar,
  Shield,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { apiClient } from '@/lib/api';

interface AnalyticsData {
  totalBudget: number;
  spentBudget: number;
  projectedSpend: number;
  riskScore: number;
  efficiency: number;
  roi: number;
  activeProjects: number;
  completedMilestones: number;
  upcomingDeadlines: number;
  budgetVariance: number;
  teamUtilization: number;
  costPerMilestone: number;
}

interface RiskAlert {
  id: string;
  type: 'budget' | 'timeline' | 'resource' | 'quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  impact: string;
  recommendation: string;
  probability: number;
}

interface PredictiveInsight {
  id: string;
  category: 'budget' | 'timeline' | 'performance';
  prediction: string;
  confidence: number;
  timeframe: string;
  actionable: boolean;
}

export function AdvancedAnalyticsDashboard() {
  const { formatCurrency } = useCurrency();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
    fetchRiskAlerts();
    fetchPredictiveInsights();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch comprehensive analytics data from the new analytics endpoint
      const analyticsData = await apiClient.getAnalyticsDashboard();
      
      const realData: AnalyticsData = {
        totalBudget: analyticsData?.total_budget || 0,
        spentBudget: analyticsData?.total_spent || 0,
        projectedSpend: analyticsData?.projected_spend || 0,
        riskScore: analyticsData?.risk_score || 0,
        efficiency: analyticsData?.efficiency_score || 0,
        roi: analyticsData?.roi || 0,
        activeProjects: analyticsData?.active_projects || 0,
        completedMilestones: analyticsData?.completed_milestones || 0,
        upcomingDeadlines: analyticsData?.in_progress_milestones || 0,
        budgetVariance: analyticsData?.budget_utilization > 100 ? 
          (analyticsData.budget_utilization - 100) : -(100 - (analyticsData?.budget_utilization || 0)),
        teamUtilization: analyticsData?.team_utilization || 0,
        costPerMilestone: analyticsData?.cost_per_milestone || 0
      };
      setAnalyticsData(realData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRiskAlerts = async () => {
    try {
      const risksData = await apiClient.getAnalyticsRisks();
      setRiskAlerts(risksData.risks || []);
    } catch (error) {
      console.error('Error fetching risk alerts:', error);
      setRiskAlerts([]);
    }
  };

  const fetchPredictiveInsights = async () => {
    try {
      const insightsData = await apiClient.getAnalyticsInsights();
      setPredictiveInsights(insightsData.insights || []);
    } catch (error) {
      console.error('Error fetching predictive insights:', error);
      setPredictiveInsights([]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchAnalyticsData(),
      fetchRiskAlerts(),
      fetchPredictiveInsights()
    ]);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score <= 25) return 'text-green-600';
    if (score <= 50) return 'text-yellow-600';
    if (score <= 75) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            Advanced Analytics
          </h1>
          <p className="text-gray-600 mt-1">AI-powered insights and predictive analytics</p>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Budget Efficiency</p>
                <p className="text-2xl font-bold">{analyticsData.efficiency}%</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-sm">+5.2% vs last month</span>
                </div>
              </div>
              <Target className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">ROI</p>
                <p className="text-2xl font-bold">{analyticsData.roi}%</p>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span className="text-sm">Excellent performance</span>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Risk Score</p>
                <p className={`text-2xl font-bold`}>{analyticsData.riskScore}/100</p>
                <div className="flex items-center mt-1">
                  <Shield className="h-4 w-4 mr-1" />
                  <span className="text-sm">Low risk</span>
                </div>
              </div>
              <AlertTriangle className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Team Utilization</p>
                <p className="text-2xl font-bold">{analyticsData.teamUtilization}%</p>
                <div className="flex items-center mt-1">
                  <Activity className="h-4 w-4 mr-1" />
                  <span className="text-sm">Optimal range</span>
                </div>
              </div>
              <Users className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different analytics views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risks">Risk Analysis</TabsTrigger>
          <TabsTrigger value="predictions">AI Insights</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Budget Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Budget Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Budget</span>
                    <span className="font-medium">{formatCurrency(analyticsData.totalBudget)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Spent</span>
                    <span className="font-medium">{formatCurrency(analyticsData.spentBudget)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Projected</span>
                    <span className="font-medium">{formatCurrency(analyticsData.projectedSpend)}</span>
                  </div>
                  <Progress 
                    value={(analyticsData.spentBudget / analyticsData.totalBudget) * 100} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{((analyticsData.spentBudget / analyticsData.totalBudget) * 100).toFixed(1)}% used</span>
                    <span>{formatCurrency(analyticsData.totalBudget - analyticsData.spentBudget)} remaining</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Project Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{analyticsData.activeProjects}</div>
                    <div className="text-sm text-gray-600">Active Projects</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{analyticsData.completedMilestones}</div>
                    <div className="text-sm text-gray-600">Completed Milestones</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{analyticsData.upcomingDeadlines}</div>
                    <div className="text-sm text-gray-600">Upcoming Deadlines</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{formatCurrency(analyticsData.costPerMilestone)}</div>
                    <div className="text-sm text-gray-600">Cost per Milestone</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Risk Analysis & Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskAlerts.map((alert) => (
                  <div key={alert.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{alert.type}</Badge>
                          <span className="text-sm text-gray-500">{alert.probability}% probability</span>
                        </div>
                        <h4 className="font-medium text-gray-900">{alert.message}</h4>
                        <p className="text-sm text-gray-600 mt-1">{alert.impact}</p>
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                      <p className="text-sm text-blue-800">
                        <strong>Recommendation:</strong> {alert.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                AI-Powered Predictive Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictiveInsights.map((insight) => (
                  <div key={insight.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{insight.category}</Badge>
                          <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-yellow-500" />
                            <span className="text-sm text-gray-500">{insight.confidence}% confidence</span>
                          </div>
                          {insight.actionable && (
                            <Badge className="bg-green-100 text-green-800">Actionable</Badge>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900">{insight.prediction}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{insight.timeframe}</span>
                        </div>
                      </div>
                    </div>
                    <Progress value={insight.confidence} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Budget Variance</span>
                    <div className="flex items-center gap-2">
                      {analyticsData.budgetVariance < 0 ? (
                        <ArrowDownRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-red-500" />
                      )}
                      <span className={analyticsData.budgetVariance < 0 ? 'text-green-600' : 'text-red-600'}>
                        {Math.abs(analyticsData.budgetVariance)}%
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={Math.abs(analyticsData.budgetVariance)} 
                    className="h-2"
                  />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Team Utilization</span>
                    <span className="text-blue-600 font-medium">{analyticsData.teamUtilization}%</span>
                  </div>
                  <Progress value={analyticsData.teamUtilization} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Project Efficiency</span>
                    <span className="text-green-600 font-medium">{analyticsData.efficiency}%</span>
                  </div>
                  <Progress value={analyticsData.efficiency} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate Detailed Report
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Review Risk Mitigation
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Target className="h-4 w-4 mr-2" />
                    Optimize Resource Allocation
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Schedule Strategy Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdvancedAnalyticsDashboard;