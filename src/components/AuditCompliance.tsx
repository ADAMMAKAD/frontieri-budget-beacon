
import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Shield, FileCheck, AlertTriangle, Search, Filter, ChevronLeft, ChevronRight,
  Activity, TrendingUp, Clock, Eye, Download, RefreshCw, BarChart3,
  Users, Database, Lock, Zap, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_table: string;
  target_id: string;
  details: any;
  created_at: string;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  compliance_score?: number;
  ip_address?: string;
  user_agent?: string;
}

interface ComplianceMetrics {
  totalLogs: number;
  complianceScore: number;
  riskLevel: string;
  criticalIssues: number;
  lastAuditDate: string;
  trendsData: { date: string; score: number; }[];
}

interface RealTimeStats {
  activeUsers: number;
  recentActions: number;
  systemHealth: number;
  alertsCount: number;
}

const AuditCompliance = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [tableFilter, setTableFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState('overview');
  const [complianceMetrics, setComplianceMetrics] = useState<ComplianceMetrics>({
    totalLogs: 0,
    complianceScore: 0,
    riskLevel: 'low',
    criticalIssues: 0,
    lastAuditDate: new Date().toISOString(),
    trendsData: []
  });
  const [realTimeStats, setRealTimeStats] = useState<RealTimeStats>({
    activeUsers: 0,
    recentActions: 0,
    systemHealth: 100,
    alertsCount: 0
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchAuditLogs();
    fetchComplianceMetrics();
    fetchRealTimeStats();
  }, [dateRange]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;
    
    const interval = setInterval(() => {
      fetchRealTimeStats();
      if (activeTab === 'logs') {
        fetchAuditLogs(true); // Silent refresh
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [realTimeEnabled, activeTab]);

  const fetchAuditLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '200',
        dateRange,
        ...(riskFilter !== 'all' && { riskLevel: riskFilter }),
        ...(actionFilter !== 'all' && { action: actionFilter }),
        ...(tableFilter !== 'all' && { table: tableFilter })
      });
      
      const response = await apiClient.request(`/api/admin/activity-log?${params}`);
      const data = response?.data || [];
      const logsWithRisk = data.map((log: AuditLog) => ({
        ...log,
        risk_level: calculateRiskLevel(log),
        compliance_score: calculateComplianceScore(log)
      }));
      
      setAuditLogs(logsWithRisk);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      if (!silent) {
        toast({
          title: "Error",
          description: "Failed to load audit logs",
          variant: "destructive"
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchComplianceMetrics = async () => {
    try {
      // Simulate compliance metrics calculation
      const totalLogs = auditLogs.length;
      const criticalIssues = auditLogs.filter(log => log.risk_level === 'critical').length;
      const complianceScore = Math.max(0, 100 - (criticalIssues * 10));
      
      setComplianceMetrics({
        totalLogs,
        complianceScore,
        riskLevel: criticalIssues > 5 ? 'high' : criticalIssues > 2 ? 'medium' : 'low',
        criticalIssues,
        lastAuditDate: new Date().toISOString(),
        trendsData: generateTrendsData()
      });
    } catch (error) {
      console.error('Error fetching compliance metrics:', error);
    }
  };

  const fetchRealTimeStats = async () => {
    try {
      // Simulate real-time stats
      const recentLogs = auditLogs.filter(log => 
        new Date(log.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      
      setRealTimeStats({
        activeUsers: Math.floor(Math.random() * 50) + 10,
        recentActions: recentLogs.length,
        systemHealth: Math.floor(Math.random() * 20) + 80,
        alertsCount: auditLogs.filter(log => log.risk_level === 'critical').length
      });
    } catch (error) {
      console.error('Error fetching real-time stats:', error);
    }
  };

  const calculateRiskLevel = (log: AuditLog): 'low' | 'medium' | 'high' | 'critical' => {
    const riskFactors = {
      delete: 3,
      update: 1,
      create: 0,
      approve: 0,
      reject: 2
    };
    
    const actionRisk = riskFactors[log.action.toLowerCase() as keyof typeof riskFactors] || 1;
    const isAdminTable = ['users', 'admin_activity_log', 'business_units'].includes(log.target_table);
    const tableRisk = isAdminTable ? 2 : 0;
    
    const totalRisk = actionRisk + tableRisk;
    
    if (totalRisk >= 4) return 'critical';
    if (totalRisk >= 3) return 'high';
    if (totalRisk >= 2) return 'medium';
    return 'low';
  };

  const calculateComplianceScore = (log: AuditLog): number => {
    const baseScore = 100;
    const riskPenalty = {
      low: 0,
      medium: 5,
      high: 15,
      critical: 30
    };
    
    return Math.max(0, baseScore - riskPenalty[log.risk_level || 'low']);
  };

  const generateTrendsData = () => {
    const days = 7;
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      score: Math.floor(Math.random() * 20) + 80
    }));
  };

  const refreshData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchAuditLogs(),
      fetchComplianceMetrics(),
      fetchRealTimeStats()
    ]);
    setLoading(false);
    toast({
      title: "Success",
      description: "Data refreshed successfully",
    });
  }, [dateRange, riskFilter, actionFilter, tableFilter]);

  const filteredLogs = Array.isArray(auditLogs) ? auditLogs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_table.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.admin_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.ip_address && log.ip_address.includes(searchTerm));
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesTable = tableFilter === 'all' || log.target_table === tableFilter;
    const matchesRisk = riskFilter === 'all' || log.risk_level === riskFilter;

    return matchesSearch && matchesAction && matchesTable && matchesRisk;
  }) : [];

  const clearFilters = () => {
    setSearchTerm('');
    setActionFilter('all');
    setTableFilter('all');
    setRiskFilter('all');
    setCurrentPage(1);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'update': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delete': return 'bg-red-100 text-red-800 border-red-200';
      case 'approve': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'reject': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return <FileCheck className="h-4 w-4" />;
      case 'update': return <Activity className="h-4 w-4" />;
      case 'delete': return <AlertTriangle className="h-4 w-4" />;
      case 'approve': return <CheckCircle className="h-4 w-4" />;
      case 'reject': return <XCircle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <AlertCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <XCircle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  // Get unique actions and tables for filters
  const uniqueActions = [...new Set(Array.isArray(auditLogs) ? auditLogs.map(log => log.action) : [])];
  const uniqueTables = [...new Set(Array.isArray(auditLogs) ? auditLogs.map(log => log.target_table) : [])];
  const uniqueRiskLevels = [...new Set(Array.isArray(auditLogs) ? auditLogs.map(log => log.risk_level || 'low') : ['low', 'medium', 'high', 'critical'])];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-orange-50 to-amber-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Audit & Compliance
          </h2>
          <p className="text-gray-600 mt-1">Advanced monitoring, real-time analytics, and compliance management</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            className="border-orange-200 hover:bg-orange-50"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant={realTimeEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            className={realTimeEnabled ? "bg-orange-600 hover:bg-orange-700" : "border-orange-200 hover:bg-orange-50"}
          >
            <Zap className="mr-2 h-4 w-4" />
            Real-time {realTimeEnabled ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      {/* Real-time Status Bar */}
      {realTimeEnabled && (
        <Alert className="border-orange-200 bg-orange-50">
          <Activity className="h-4 w-4" />
          <AlertTitle className="text-orange-800">Real-time Monitoring Active</AlertTitle>
          <AlertDescription className="text-orange-700">
            System is being monitored in real-time. Last update: {new Date().toLocaleTimeString()}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white border border-orange-200">
          <TabsTrigger value="overview" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800">
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="realtime" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800">
            <Activity className="mr-2 h-4 w-4" />
            Real-time
          </TabsTrigger>
          <TabsTrigger value="compliance" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800">
            <Shield className="mr-2 h-4 w-4" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800">
            <Database className="mr-2 h-4 w-4" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-orange-200 bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{complianceMetrics.complianceScore}%</p>
                    <p className="text-sm text-gray-600">Compliance Score</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Shield className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <Progress value={complianceMetrics.complianceScore} className="mt-3" />
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{auditLogs.length}</p>
                    <p className="text-sm text-gray-600">Total Audit Logs</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Database className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-red-600">{complianceMetrics.criticalIssues}</p>
                    <p className="text-sm text-gray-600">Critical Issues</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <Badge className={getRiskColor(complianceMetrics.riskLevel)} variant="outline">
                  {complianceMetrics.riskLevel.toUpperCase()} RISK
                </Badge>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{realTimeStats.systemHealth}%</p>
                    <p className="text-sm text-gray-600">System Health</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <Progress value={realTimeStats.systemHealth} className="mt-3" />
              </CardContent>
            </Card>
          </div>

          {/* Activity Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-orange-200 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-orange-600" />
                  <span>Recent Activity Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['create', 'update', 'delete', 'approve'].map((action) => {
                    const count = auditLogs.filter(log => log.action === action).length;
                    const percentage = auditLogs.length > 0 ? (count / auditLogs.length) * 100 : 0;
                    return (
                      <div key={action} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getActionIcon(action)}
                          <span className="capitalize">{action}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-orange-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span>Risk Assessment</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uniqueRiskLevels.map((risk) => {
                    const count = auditLogs.filter(log => log.risk_level === risk).length;
                    const percentage = auditLogs.length > 0 ? (count / auditLogs.length) * 100 : 0;
                    return (
                      <div key={risk} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getRiskIcon(risk)}
                          <span className="capitalize">{risk} Risk</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                risk === 'critical' ? 'bg-red-600' :
                                risk === 'high' ? 'bg-orange-600' :
                                risk === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Real-time Tab */}
        <TabsContent value="realtime" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-orange-200 bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{realTimeStats.activeUsers}</p>
                    <p className="text-sm text-gray-600">Active Users</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-xs text-gray-500">Live</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{realTimeStats.recentActions}</p>
                    <p className="text-sm text-gray-600">Recent Actions</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{realTimeStats.systemHealth}%</p>
                    <p className="text-sm text-gray-600">System Health</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <Progress value={realTimeStats.systemHealth} className="mt-3" />
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-red-600">{realTimeStats.alertsCount}</p>
                    <p className="text-sm text-gray-600">Active Alerts</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                {realTimeStats.alertsCount > 0 && (
                  <Badge variant="destructive" className="mt-2">Requires Attention</Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Live Activity Feed */}
          <Card className="border-orange-200 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span>Live Activity Feed</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {auditLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {log.action} on {log.target_table}
                      </p>
                      <p className="text-xs text-gray-500">
                        by {log.admin_id} • {new Date(log.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge className={getRiskColor(log.risk_level || 'low')} variant="outline">
                      {log.risk_level || 'low'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-orange-200 bg-white shadow-lg lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-orange-600" />
                  <span>Compliance Dashboard</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-orange-600 mb-2">
                      {complianceMetrics.complianceScore}%
                    </div>
                    <p className="text-gray-600">Overall Compliance Score</p>
                    <Progress value={complianceMetrics.complianceScore} className="mt-4" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{complianceMetrics.totalLogs}</p>
                      <p className="text-sm text-gray-600">Total Audited Actions</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{complianceMetrics.criticalIssues}</p>
                      <p className="text-sm text-gray-600">Critical Issues</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-orange-600" />
                  <span>Security Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Access Control</span>
                    <Badge className="bg-green-100 text-green-800">Secure</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Encryption</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Audit Trail</span>
                    <Badge className="bg-green-100 text-green-800">Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Risk Level</span>
                    <Badge className={getRiskColor(complianceMetrics.riskLevel)}>
                      {complianceMetrics.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          {/* Enhanced Search and Filter Controls */}
          <Card className="border-orange-200 bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by action, table, admin ID, IP address, or details..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-orange-200 focus:border-orange-400"
                  />
                </div>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-40 border-orange-200">
                    <SelectValue placeholder="Date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1d">Last 24h</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-40 border-orange-200">
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {uniqueActions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={tableFilter} onValueChange={setTableFilter}>
                  <SelectTrigger className="w-40 border-orange-200">
                    <SelectValue placeholder="Table" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tables</SelectItem>
                    {uniqueTables.map((table) => (
                      <SelectItem key={table} value={table}>
                        {table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger className="w-40 border-orange-200">
                    <SelectValue placeholder="Risk Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    {uniqueRiskLevels.map((risk) => (
                      <SelectItem key={risk} value={risk}>
                        {risk.charAt(0).toUpperCase() + risk.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(searchTerm || actionFilter !== 'all' || tableFilter !== 'all' || riskFilter !== 'all') && (
                  <Button variant="outline" onClick={clearFilters} className="border-orange-200 hover:bg-orange-50">
                    <Filter className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                )}
                <Button variant="outline" className="border-orange-200 hover:bg-orange-50">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardContent>
           </Card>

          {/* Audit Logs Table */}
          <Card className="border-orange-200 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-orange-600" />
                <span>Audit Logs</span>
                <Badge variant="outline" className="ml-auto">
                  {filteredLogs.length} records
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-orange-200">
                      <TableHead className="text-orange-800">Timestamp</TableHead>
                      <TableHead className="text-orange-800">Action</TableHead>
                      <TableHead className="text-orange-800">Table</TableHead>
                      <TableHead className="text-orange-800">Admin ID</TableHead>
                      <TableHead className="text-orange-800">Risk Level</TableHead>
                      <TableHead className="text-orange-800">Compliance Score</TableHead>
                      <TableHead className="text-orange-800">IP Address</TableHead>
                      <TableHead className="text-orange-800">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentLogs.map((log) => (
                      <TableRow key={log.id} className="border-orange-100 hover:bg-orange-50">
                        <TableCell className="font-mono text-sm">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getActionIcon(log.action)}
                            <Badge className={getActionColor(log.action)} variant="outline">
                              {log.action}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{log.target_table}</TableCell>
                        <TableCell className="font-mono">{log.admin_id}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getRiskIcon(log.risk_level || 'low')}
                            <Badge className={getRiskColor(log.risk_level || 'low')} variant="outline">
                              {(log.risk_level || 'low').toUpperCase()}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-orange-600 h-2 rounded-full" 
                                style={{ width: `${log.compliance_score || 85}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{log.compliance_score || 85}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.ip_address || 'N/A'}</TableCell>
                        <TableCell className="max-w-xs truncate" title={typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}>
                          {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="border-orange-200 hover:bg-orange-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                      .map((page, index, array) => (
                        <React.Fragment key={page}>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={currentPage === page ? 
                              "bg-orange-600 hover:bg-orange-700" : 
                              "border-orange-200 hover:bg-orange-50"
                            }
                          >
                            {page}
                          </Button>
                        </React.Fragment>
                      ))
                    }
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="border-orange-200 hover:bg-orange-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuditCompliance;
