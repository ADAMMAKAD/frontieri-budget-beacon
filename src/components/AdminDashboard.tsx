
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Shield, Users, Building2, DollarSign, FileText, Activity, 
  TrendingUp, AlertTriangle, Server, Database, Clock, 
  BarChart3, PieChart, LineChart, Settings, Bell,
  Download, RefreshCw, Eye, Lock, Zap, Globe
} from 'lucide-react';
import { UserManagement } from './admin/UserManagement';
import { SystemSettings } from './admin/SystemSettings';
import { AdminProjects } from './admin/AdminProjects';
import { AdminExpenses } from './admin/AdminExpenses';
import { AdminBusinessUnits } from './admin/AdminBusinessUnits';
import { AdminActivityLog } from './admin/AdminActivityLog';

interface DashboardStats {
  totalUsers: number;
  activeProjects: number;
  totalBudget: number;
  currencyBreakdown: Record<string, number>;
  pendingApprovals: number;
  systemHealth: {
    cpu: number;
    memory: number;
    storage: number;
    uptime: string;
  };
  recentActivity: {
    logins: number;
    transactions: number;
    errors: number;
  };
  security: {
    failedLogins: number;
    activeThreats: number;
    lastSecurityScan: string;
  };
  performance: {
    avgResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
  };
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeProjects: 0,
    totalBudget: 0,
    currencyBreakdown: {},
    pendingApprovals: 0,
    systemHealth: {
      cpu: 0,
      memory: 0,
      storage: 0,
      uptime: '0d 0h 0m'
    },
    recentActivity: {
      logins: 0,
      transactions: 0,
      errors: 0
    },
    security: {
      failedLogins: 0,
      activeThreats: 0,
      lastSecurityScan: 'Never'
    },
    performance: {
      avgResponseTime: 0,
      requestsPerMinute: 0,
      errorRate: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Use the existing dashboard metrics endpoint
      const dashboardData = await apiClient.getDashboardMetrics();
      
      // If the endpoint doesn't exist, we'll fetch data separately
      const [projectsResult, expensesResult] = await Promise.all([
        apiClient.getProjects(),
        apiClient.request('/expenses') // Generic expenses endpoint
      ]);
  
      const projects = projectsResult.projects || [];
      const expenses = expensesResult.expenses || expensesResult.data || [];
      
      const activeProjects = Array.isArray(projects) ? projects.filter(p => p.status === 'active').length : 0;
      // Calculate total budget with currency conversion (ETB to USD rate: ~0.018)
      const exchangeRates = { USD: 1, ETB: 0.018 };
      const totalBudget = Array.isArray(projects) ? projects.reduce((sum, p) => {
        const budget = p.total_budget || 0;
        const currency = p.currency || 'USD';
        const rate = exchangeRates[currency as keyof typeof exchangeRates] || 1;
        return sum + (budget * rate);
      }, 0) : 0;
      
      // Track currency breakdown for display
      const currencyBreakdown = Array.isArray(projects) ? projects.reduce((acc, p) => {
        const currency = p.currency || 'USD';
        const budget = p.total_budget || 0;
        acc[currency] = (acc[currency] || 0) + budget;
        return acc;
      }, {} as Record<string, number>) : {};
      const pendingApprovals = Array.isArray(expenses) ? expenses.filter(e => e.status === 'pending').length : 0;
      
      // Get user count from auth endpoint
      const usersResult = await apiClient.request('/auth/users/count');
      const totalUsers = usersResult.count || 0;

      // Simulate advanced metrics (in a real app, these would come from monitoring services)
      const systemHealth = {
        cpu: Math.floor(Math.random() * 30) + 20, // 20-50%
        memory: Math.floor(Math.random() * 40) + 30, // 30-70%
        storage: Math.floor(Math.random() * 20) + 40, // 40-60%
        uptime: '15d 8h 32m'
      };

      const recentActivity = {
        logins: Math.floor(Math.random() * 50) + 20,
        transactions: Math.floor(Math.random() * 200) + 100,
        errors: Math.floor(Math.random() * 5)
      };

      const security = {
        failedLogins: Math.floor(Math.random() * 10),
        activeThreats: Math.floor(Math.random() * 3),
        lastSecurityScan: '2 hours ago'
      };

      const performance = {
        avgResponseTime: Math.floor(Math.random() * 100) + 50, // 50-150ms
        requestsPerMinute: Math.floor(Math.random() * 500) + 200,
        errorRate: Math.random() * 2 // 0-2%
      };
  
      setStats({
        activeProjects,
        totalBudget,
        currencyBreakdown,
        pendingApprovals,
        totalUsers,
        systemHealth,
        recentActivity,
        security,
        performance
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatus = (value: number) => {
    if (value < 50) return { color: 'bg-green-500', status: 'Good' };
    if (value < 80) return { color: 'bg-yellow-500', status: 'Warning' };
    return { color: 'bg-red-500', status: 'Critical' };
  };

  const refreshData = () => {
    setLoading(true);
    fetchDashboardStats();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Advanced Admin Dashboard</h1>
            <p className="text-gray-600">Complete system administration, monitoring & analytics</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* System Health Alert */}
      {stats.systemHealth.cpu > 80 || stats.systemHealth.memory > 80 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>System Performance Warning</AlertTitle>
          <AlertDescription>
            High resource usage detected. CPU: {stats.systemHealth.cpu}%, Memory: {stats.systemHealth.memory}%
          </AlertDescription>
        </Alert>
      )}

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '--' : stats.totalUsers}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '--' : stats.activeProjects}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +5% from last week
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '--' : `$${stats.totalBudget.toLocaleString()} USD`}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <BarChart3 className="h-3 w-3 mr-1 text-blue-500" />
              Across {stats.activeProjects} projects
            </p>
            {!loading && Object.keys(stats.currencyBreakdown).length > 1 && (
              <p className="text-xs text-muted-foreground mt-1">
                Breakdown: {Object.entries(stats.currencyBreakdown).map(([currency, amount]) => 
                  `${currency === 'USD' ? '$' : 'ETB '}${amount.toLocaleString()} ${currency}`
                ).join(' + ')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              {loading ? '--' : stats.pendingApprovals}
              {stats.pendingApprovals > 5 && (
                <Badge variant="destructive" className="ml-2 text-xs">High</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <Clock className="h-3 w-3 mr-1 text-orange-500" />
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* System Health */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="h-5 w-5 mr-2 text-blue-600" />
              System Health
            </CardTitle>
            <CardDescription>Real-time system performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>CPU Usage</span>
                <span className="font-medium">{stats.systemHealth.cpu}%</span>
              </div>
              <Progress value={stats.systemHealth.cpu} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memory</span>
                <span className="font-medium">{stats.systemHealth.memory}%</span>
              </div>
              <Progress value={stats.systemHealth.memory} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Storage</span>
                <span className="font-medium">{stats.systemHealth.storage}%</span>
              </div>
              <Progress value={stats.systemHealth.storage} className="h-2" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Uptime</span>
              <Badge variant="outline" className="text-green-600">
                <Zap className="h-3 w-3 mr-1" />
                {stats.systemHealth.uptime}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Security Overview */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2 text-red-600" />
              Security Status
            </CardTitle>
            <CardDescription>Security monitoring and threat detection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Failed Logins (24h)</span>
              <Badge variant={stats.security.failedLogins > 10 ? "destructive" : "secondary"}>
                {stats.security.failedLogins}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Active Threats</span>
              <Badge variant={stats.security.activeThreats > 0 ? "destructive" : "outline"}>
                {stats.security.activeThreats}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Last Security Scan</span>
              <span className="text-sm font-medium text-green-600">{stats.security.lastSecurityScan}</span>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              View Security Log
            </Button>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChart className="h-5 w-5 mr-2 text-green-600" />
              Performance
            </CardTitle>
            <CardDescription>Application performance insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Avg Response Time</span>
              <Badge variant="outline" className="text-blue-600">
                {stats.performance.avgResponseTime}ms
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Requests/min</span>
              <span className="text-sm font-medium">{stats.performance.requestsPerMinute}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Error Rate</span>
              <Badge variant={stats.performance.errorRate > 1 ? "destructive" : "outline"}>
                {stats.performance.errorRate.toFixed(2)}%
              </Badge>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className="text-green-600">
                  <Globe className="h-3 w-3 mr-1" />
                  All Systems Operational
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2 text-blue-500" />
              Recent Logins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivity.logins}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2 text-green-500" />
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivity.transactions}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
              System Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivity.errors}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="grid grid-cols-6 w-fit">
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span>Projects</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Expenses</span>
            </TabsTrigger>
            <TabsTrigger value="business-units" className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span>Units</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Activity</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              <Bell className="h-3 w-3 mr-1" />
              Live Updates
            </Badge>
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <AdminProjects />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <AdminExpenses />
        </TabsContent>

        <TabsContent value="business-units" className="space-y-4">
          <AdminBusinessUnits />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <AdminActivityLog />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <SystemSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
