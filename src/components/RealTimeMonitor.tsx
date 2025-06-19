import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Wifi,
  Database,
  Server,
  Users,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Play,
  Pause,
  Settings
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { apiClient } from '@/lib/api';

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

interface LiveTransaction {
  id: string;
  type: 'expense' | 'budget_allocation' | 'milestone_completion';
  amount?: number;
  description: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
}

interface PerformanceData {
  timestamp: Date;
  cpu: number;
  memory: number;
  network: number;
}

export function RealTimeMonitor() {
  const { formatCurrency } = useCurrency();
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [liveTransactions, setLiveTransactions] = useState<LiveTransaction[]>([]);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    // Initialize with real data
    const initializeData = async () => {
      await initializeMetrics();
      await initializeTransactions();
      initializePerformanceHistory();
    };
    
    initializeData();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      if (isMonitoring) {
        updateMetrics();
        addNewTransaction();
        updatePerformanceHistory();
        setLastUpdate(new Date());
      }
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const initializeMetrics = async () => {
    try {
      // Fetch real data from API
      const [dashboardData, projectsData] = await Promise.all([
        apiClient.getDashboardMetrics(),
        apiClient.getProjects()
      ]);
      
      const projects = projectsData.projects || [];
      const activeProjects = dashboardData?.active_projects || 0;
      const budgetUtilization = dashboardData?.budget_utilization || 0;
      
      const metrics: SystemMetric[] = [
        {
          id: 'active_projects',
          name: 'Active Projects',
          value: activeProjects,
          unit: 'projects',
          status: activeProjects > 0 ? 'healthy' : 'warning',
          trend: activeProjects > 5 ? 'up' : 'stable',
          lastUpdated: new Date()
        },
        {
          id: 'budget_utilization',
          name: 'Budget Utilization',
          value: Math.round(budgetUtilization),
          unit: '%',
          status: budgetUtilization < 90 ? 'healthy' : budgetUtilization < 95 ? 'warning' : 'critical',
          trend: budgetUtilization > 75 ? 'up' : 'stable',
          lastUpdated: new Date()
        },
        {
          id: 'total_projects',
          name: 'Total Projects',
          value: dashboardData?.total_projects || 0,
          unit: 'projects',
          status: 'healthy',
          trend: 'stable',
          lastUpdated: new Date()
        },
        {
          id: 'completed_projects',
          name: 'Completed Projects',
          value: dashboardData?.completed_projects || 0,
          unit: 'projects',
          status: 'healthy',
          trend: 'up',
          lastUpdated: new Date()
        },
        {
           id: 'projects_on_hold',
           name: 'Projects on Hold',
           value: dashboardData?.on_hold_projects || 0,
           unit: 'projects',
           status: (dashboardData?.on_hold_projects || 0) > 0 ? 'warning' : 'healthy',
           trend: 'stable',
           lastUpdated: new Date()
         },
         {
           id: 'total_budget',
           name: 'Total Budget',
           value: Math.round((dashboardData?.total_budget || 0) / 1000),
           unit: 'K',
           status: 'healthy',
           trend: 'up',
           lastUpdated: new Date()
         }
       ];
       setSystemMetrics(metrics);
     } catch (error) {
       console.error('Error fetching metrics:', error);
       // Fallback to basic metrics if API fails
       setSystemMetrics([]);
     }
   };

  const initializeTransactions = async () => {
    try {
      // Fetch recent expenses or project activities
      const expensesData = await apiClient.request('/expenses?limit=5');
        const expenses = expensesData.expenses || expensesData.data || [];
      
      const transactions: LiveTransaction[] = expenses.map((expense: any, index: number) => ({
        id: expense.id || index.toString(),
        type: 'expense',
        amount: expense.amount || 0,
        description: expense.description || 'Project expense',
        timestamp: new Date(expense.created_at || Date.now() - (index * 60000)),
        status: expense.status || 'completed'
      }));
      
      setLiveTransactions(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Fallback to empty transactions if API fails
      setLiveTransactions([]);
    }
  };

  // Initialize performance history with empty data
  const initializePerformanceHistory = () => {
    const history: PerformanceData[] = [];
    const now = new Date();
    
    // Create initial data points for the last 20 intervals
    for (let i = 19; i >= 0; i--) {
      history.push({
        timestamp: new Date(now.getTime() - i * 180000), // 3 minutes apart
        cpu: Math.floor(Math.random() * 30) + 20,
        memory: Math.floor(Math.random() * 40) + 30,
        network: Math.floor(Math.random() * 50) + 25
      });
    }
    
    setPerformanceHistory(history);
  };

  const updateMetrics = async () => {
    // Refresh metrics with latest data
    await initializeMetrics();
  };

  const addNewTransaction = async () => {
    if (Math.random() < 0.3) { // 30% chance of new transaction
      try {
        const response = await apiClient.request('/expenses?limit=1');
        if (response.data && response.data.length > 0) {
          const expense = response.data[0];
          const newTransaction: LiveTransaction = {
            id: expense.id.toString(),
            type: 'expense',
            amount: expense.amount,
            description: expense.description || 'Recent expense',
            timestamp: new Date(expense.created_at),
            status: expense.status || 'completed'
          };
          setLiveTransactions(prev => [newTransaction, ...prev.slice(0, 9)]); // Keep only 10 most recent
        }
      } catch (error) {
        console.error('Error fetching latest transaction:', error);
      }
    }
  };

  const updatePerformanceHistory = () => {
    const newDataPoint: PerformanceData = {
      timestamp: new Date(),
      cpu: Math.floor(Math.random() * 30) + 20, // Random CPU usage between 20-50%
      memory: Math.floor(Math.random() * 40) + 30, // Random memory usage between 30-70%
      network: Math.floor(Math.random() * 50) + 25 // Random network usage between 25-75%
    };

    setPerformanceHistory(prev => [...prev.slice(-19), newDataPoint]); // Keep last 20 data points
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertCircle className="h-4 w-4" />;
      case 'critical': return <AlertCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-500" />;
      default: return <Activity className="h-3 w-3 text-gray-500" />;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'expense': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'budget_allocation': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'milestone_completion': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-8 w-8 text-green-600" />
            Real-Time Monitor
          </h1>
          <p className="text-gray-600 mt-1">Live system performance and activity tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>
          <Button
            variant={isMonitoring ? "default" : "outline"}
            size="sm"
            onClick={() => setIsMonitoring(!isMonitoring)}
          >
            {isMonitoring ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </>
            )}
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {systemMetrics.map((metric) => (
          <Card key={metric.id} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {metric.id === 'active_users' && <Users className="h-4 w-4 text-blue-500" />}
                  {metric.id === 'system_load' && <Server className="h-4 w-4 text-purple-500" />}
                  {metric.id === 'response_time' && <Zap className="h-4 w-4 text-yellow-500" />}
                  {metric.id === 'error_rate' && <AlertCircle className="h-4 w-4 text-red-500" />}
                  {metric.id === 'database_connections' && <Database className="h-4 w-4 text-green-500" />}
                  {metric.id === 'transactions_per_minute' && <Activity className="h-4 w-4 text-orange-500" />}
                  <span className="text-sm font-medium text-gray-700">{metric.name}</span>
                </div>
                <Badge className={getStatusColor(metric.status)}>
                  {getStatusIcon(metric.status)}
                </Badge>
              </div>
              
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {metric.value}
                    <span className="text-sm font-normal text-gray-500 ml-1">{metric.unit}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(metric.trend)}
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(metric.lastUpdated)}
                    </span>
                  </div>
                </div>
                
                {/* Mini progress indicator for load-based metrics */}
                {(metric.id === 'system_load' || metric.id === 'error_rate') && (
                  <div className="w-16">
                    <Progress 
                      value={metric.id === 'system_load' ? metric.value : metric.value * 20} 
                      className="h-1"
                    />
                  </div>
                )}
              </div>
              
              {/* Status indicator line */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 ${
                metric.status === 'healthy' ? 'bg-green-400' :
                metric.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
              }`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Live Transaction Feed
              {isMonitoring && (
                <div className="flex items-center gap-1 ml-auto">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600">LIVE</span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {liveTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="mt-0.5">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {transaction.description}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          transaction.status === 'completed' ? 'border-green-200 text-green-700' :
                          transaction.status === 'pending' ? 'border-yellow-200 text-yellow-700' :
                          'border-red-200 text-red-700'
                        }`}
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(transaction.timestamp)}
                      </span>
                      {transaction.amount && (
                        <span className="text-sm font-medium text-gray-700">
                          {formatCurrency(transaction.amount)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* System Load Trend */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">System Load</span>
                  <span className="text-sm text-gray-500">
                    {systemMetrics.find(m => m.id === 'system_load')?.value}%
                  </span>
                </div>
                <Progress 
                  value={systemMetrics.find(m => m.id === 'system_load')?.value || 0} 
                  className="h-2"
                />
              </div>
              
              {/* Response Time */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Response Time</span>
                  <span className="text-sm text-gray-500">
                    {systemMetrics.find(m => m.id === 'response_time')?.value}ms
                  </span>
                </div>
                <Progress 
                  value={(systemMetrics.find(m => m.id === 'response_time')?.value || 0) / 5} 
                  className="h-2"
                />
              </div>
              
              {/* Active Users */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Active Users</span>
                  <span className="text-sm text-gray-500">
                    {systemMetrics.find(m => m.id === 'active_users')?.value}
                  </span>
                </div>
                <Progress 
                  value={systemMetrics.find(m => m.id === 'active_users')?.value || 0} 
                  className="h-2"
                />
              </div>
              
              {/* Error Rate */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Error Rate</span>
                  <span className="text-sm text-gray-500">
                    {systemMetrics.find(m => m.id === 'error_rate')?.value}%
                  </span>
                </div>
                <Progress 
                  value={(systemMetrics.find(m => m.id === 'error_rate')?.value || 0) * 20} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>System Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="justify-start">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All
            </Button>
            <Button variant="outline" className="justify-start">
              <AlertCircle className="h-4 w-4 mr-2" />
              View Alerts
            </Button>
            <Button variant="outline" className="justify-start">
              <Database className="h-4 w-4 mr-2" />
              DB Status
            </Button>
            <Button variant="outline" className="justify-start">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RealTimeMonitor;
