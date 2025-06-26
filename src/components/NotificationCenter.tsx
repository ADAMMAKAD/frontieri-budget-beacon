
import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Bell, Check, Trash2, AlertCircle, Info, CheckCircle, 
  DollarSign, Calendar, TrendingUp, Users, FileText, 
  Clock, Filter, Search, RefreshCw, Archive, 
  CreditCard, Target, AlertTriangle, CheckSquare,
  Zap, Settings, BarChart3
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'financial' | 'project' | 'system' | 'team' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  archived?: boolean;
  action_url?: string;
  metadata?: {
    amount?: number;
    currency?: string;
    project_id?: string;
    user_id?: string;
    deadline?: string;
    progress?: number;
  };
  created_at: string;
  expires_at?: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
}

interface NotificationCenterProps {
  onNotificationUpdate?: () => void;
}

const NotificationCenter = ({ onNotificationUpdate }: NotificationCenterProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'type'>('date');
  const [showArchived, setShowArchived] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Set up real-time updates every 30 seconds
      const interval = setInterval(() => fetchNotifications(true), 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [notifications, activeTab, searchQuery, filterType, filterCategory, filterPriority, sortBy, showArchived]);

  const fetchNotifications = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setRefreshing(true);
      const data = await apiClient.getNotifications(user?.id || '');
      const notificationsData = data?.notifications || data?.data || data || [];
      
      // Enhance notifications with additional properties for demo purposes
      const enhancedNotifications = notificationsData.map((notif: any) => {
        const notification = { ...notif, archived: false };
        return {
          ...notification,
          category: getCategoryFromType(notification),
          priority: getPriorityFromType(notification),
          metadata: generateMetadata(notification)
        };
      });
      
      setNotifications(enhancedNotifications);
      calculateStats(enhancedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getCategoryFromType = (notification: Notification): string => {
    // Determine category based on notification content and type
    const title = notification.title.toLowerCase();
    const message = notification.message.toLowerCase();
    
    if (title.includes('expense') || title.includes('budget') || message.includes('budget') || message.includes('expense')) {
      return 'financial';
    }
    if (title.includes('project') || title.includes('deadline') || message.includes('project') || message.includes('deadline')) {
      return 'project';
    }
    if (title.includes('system') || title.includes('maintenance') || message.includes('system') || message.includes('maintenance')) {
      return 'system';
    }
    if (title.includes('team') || title.includes('member') || message.includes('team') || message.includes('member')) {
      return 'team';
    }
    return 'general';
  };

  const getPriorityFromType = (notification: Notification): string => {
    const { type, title, message } = notification;
    
    // High priority for errors and critical situations
    if (type === 'error' || title.toLowerCase().includes('critical') || message.toLowerCase().includes('critical')) {
      return 'critical';
    }
    
    // High priority for warnings about deadlines, budget alerts
    if (type === 'warning' && (title.toLowerCase().includes('deadline') || title.toLowerCase().includes('budget') || title.toLowerCase().includes('exceeded'))) {
      return 'high';
    }
    
    // Medium priority for general warnings and approvals
    if (type === 'warning' || title.toLowerCase().includes('approval') || title.toLowerCase().includes('requires')) {
      return 'medium';
    }
    
    // Low priority for success and info messages
    return 'low';
  };

  const generateMetadata = (notification: Notification) => {
    const metadata: any = {};
    
    // Extract amounts from message
    const amountMatch = notification.message.match(/\$([\d,]+(?:\.\d{2})?)/g);
    if (amountMatch) {
      metadata.amount = parseFloat(amountMatch[0].replace(/[$,]/g, ''));
      metadata.currency = 'USD';
    }
    
    // Extract project info and progress
    const progressMatch = notification.message.match(/(\d+)%/);
    if (progressMatch) {
      metadata.progress = parseInt(progressMatch[1]);
    }
    
    // Extract deadline info
    const deadlineMatch = notification.message.match(/(\d+)\s+days?/);
    if (deadlineMatch) {
      const daysFromNow = parseInt(deadlineMatch[1]);
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + daysFromNow);
      metadata.deadline = deadline.toISOString();
    }
    
    return metadata;
  };

  const calculateStats = (notifs: Notification[]) => {
    const stats: NotificationStats = {
      total: notifs.length,
      unread: notifs.filter(n => !n.read).length,
      byType: {},
      byCategory: {},
      byPriority: {}
    };

    notifs.forEach(notif => {
      stats.byType[notif.type] = (stats.byType[notif.type] || 0) + 1;
      stats.byCategory[notif.category] = (stats.byCategory[notif.category] || 0) + 1;
      stats.byPriority[notif.priority] = (stats.byPriority[notif.priority] || 0) + 1;
    });

    setStats(stats);
  };

  const applyFilters = useCallback(() => {
    let filtered = [...notifications];

    // Filter by tab
    if (activeTab === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (activeTab === 'archived') {
      filtered = filtered.filter(n => n.archived);
    } else if (activeTab !== 'all') {
      filtered = filtered.filter(n => n.category === activeTab);
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filters
    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.type === filterType);
    }
    if (filterCategory !== 'all') {
      filtered = filtered.filter(n => n.category === filterCategory);
    }
    if (filterPriority !== 'all') {
      filtered = filtered.filter(n => n.priority === filterPriority);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'priority') {
        const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
      } else if (sortBy === 'type') {
        return a.type.localeCompare(b.type);
      }
      return 0;
    });

    setFilteredNotifications(filtered);
  }, [notifications, activeTab, searchQuery, filterType, filterCategory, filterPriority, sortBy, showArchived]);

  const markAsRead = async (id: string) => {
    try {
      await apiClient.markNotificationAsRead(id);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      onNotificationUpdate?.();
      toast({
        title: 'Success',
        description: 'Notification marked as read',
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      onNotificationUpdate?.();
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await apiClient.deleteNotification(id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      onNotificationUpdate?.();
      toast({
        title: 'Success',
        description: 'Notification deleted',
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    }
  };

  const archiveNotification = async (id: string) => {
    try {
      // For now, we'll handle archiving locally since the backend doesn't support it yet
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, archived: true, read: true } : notif
        )
      );
      toast({
        title: 'Success',
        description: 'Notification archived',
      });
    } catch (error) {
      console.error('Failed to archive notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive notification',
        variant: 'destructive',
      });
    }
  };

  const bulkMarkAsRead = async (ids: string[]) => {
    try {
      // For bulk operations, we'll handle them individually for now
      await Promise.all(ids.map(id => apiClient.markNotificationAsRead(id)));
      setNotifications(prev => 
        prev.map(notif => 
          ids.includes(notif.id) ? { ...notif, read: true } : notif
        )
      );
      onNotificationUpdate?.();
      toast({
        title: 'Success',
        description: `${ids.length} notifications marked as read`,
      });
    } catch (error) {
      console.error('Failed to bulk mark as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        variant: 'destructive',
      });
    }
  };

  const bulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => apiClient.deleteNotification(id)));
      setNotifications(prev => prev.filter(notif => !ids.includes(notif.id)));
      onNotificationUpdate?.();
      toast({
        title: 'Success',
        description: `${ids.length} notifications deleted`,
      });
    } catch (error) {
      console.error('Failed to bulk delete:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notifications',
        variant: 'destructive',
      });
    }
  };

  const handleNotificationAction = (notification: Notification) => {
    if (notification.action_url) {
      window.open(notification.action_url, '_blank');
    }
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    const { type, category } = notification;
    
    // Use category-based icons with type-based colors
    if (category === 'financial') {
      return type === 'error' ? 
        <DollarSign className="h-5 w-5 text-red-500" /> : 
        <DollarSign className="h-5 w-5 text-green-500" />;
    }
    if (category === 'project') {
      return type === 'warning' ? 
        <Calendar className="h-5 w-5 text-orange-500" /> : 
        <Calendar className="h-5 w-5 text-blue-500" />;
    }
    if (category === 'system') {
      return <Settings className="h-5 w-5 text-gray-500" />;
    }
    if (category === 'team') {
      return <Users className="h-5 w-5 text-purple-500" />;
    }
    
    // Fallback to type-based icons
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationBgColor = (type: string, priority: string) => {
    if (priority === 'critical') {
      return 'bg-red-50 border-red-300 shadow-red-100';
    }
    if (priority === 'high') {
      return 'bg-orange-50 border-orange-300 shadow-orange-100';
    }
    
    switch (type) {
      case 'success':
      case 'achievement':
        return 'bg-green-50 border-green-200 shadow-green-100';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 shadow-yellow-100';
      case 'error':
        return 'bg-red-50 border-red-200 shadow-red-100';
      case 'expense_approval':
        return 'bg-blue-50 border-blue-200 shadow-blue-100';
      case 'budget_alert':
        return 'bg-orange-50 border-orange-200 shadow-orange-100';
      case 'project_deadline':
        return 'bg-purple-50 border-purple-200 shadow-purple-100';
      case 'system':
        return 'bg-gray-50 border-gray-200 shadow-gray-100';
      default:
        return 'bg-blue-50 border-blue-200 shadow-blue-100';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial':
        return <DollarSign className="h-4 w-4" />;
      case 'project':
        return <FileText className="h-4 w-4" />;
      case 'approval':
        return <CheckSquare className="h-4 w-4" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getNotificationBg = (type: string, read: boolean) => {
    const base = read ? 'bg-gray-50' : 'bg-white';
    switch (type) {
      case 'success': return `${base} border-l-4 border-green-500`;
      case 'warning': return `${base} border-l-4 border-yellow-500`;
      case 'error': return `${base} border-l-4 border-red-500`;
      default: return `${base} border-l-4 border-blue-500`;
    }
  };

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0;

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">Stay updated with your latest activities</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications()}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={!stats || stats.unread === 0}
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Bell className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unread</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.unread}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Critical</p>
                  <p className="text-2xl font-bold text-red-600">{stats.byPriority.critical || 0}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Financial</p>
                  <p className="text-2xl font-bold text-green-600">{stats.byCategory.financial || 0}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="expense_approval">Expense Approval</SelectItem>
                  <SelectItem value="budget_alert">Budget Alert</SelectItem>
                  <SelectItem value="project_deadline">Project Deadline</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="achievement">Achievement</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="approval">Approval</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: 'date' | 'priority' | 'type') => setSortBy(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            All
          </TabsTrigger>
          <TabsTrigger value="unread" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Unread
            {stats && stats.unread > 0 && (
              <Badge variant="destructive" className="ml-1 px-1 py-0 text-xs">
                {stats.unread}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="project" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="approval" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Approvals
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center text-gray-500">
                  <Bell className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No notifications found</h3>
                  <p>There are no notifications matching your current filters.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`transition-all duration-200 hover:shadow-lg cursor-pointer ${
                    getNotificationBgColor(notification.type, notification.priority)
                  } ${
                    !notification.read ? 'ring-2 ring-blue-200' : ''
                  }`}
                  onClick={() => handleNotificationAction(notification)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-semibold ${
                              notification.read ? 'text-gray-600' : 'text-gray-900'
                            }`}>
                              {notification.title}
                            </h3>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getPriorityBadgeColor(notification.priority)}`}
                            >
                              {notification.priority.toUpperCase()}
                            </Badge>
                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                              {getCategoryIcon(notification.category)}
                              {notification.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className={`text-sm mb-3 ${
                          notification.read ? 'text-gray-500' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        
                        {/* Metadata Display */}
                        {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                          <div className="flex flex-wrap gap-4 mb-3 text-xs text-gray-600">
                            {notification.metadata.amount && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                <span className="font-medium">{formatCurrency(notification.metadata.amount)}</span>
                              </div>
                            )}
                            {notification.metadata.due_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Due: {new Date(notification.metadata.due_date).toLocaleDateString()}</span>
                              </div>
                            )}
                            {notification.metadata.project_id && (
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                <span>Project: {notification.metadata.project_id}</span>
                              </div>
                            )}
                            {notification.metadata.expense_id && (
                              <div className="flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                <span>Expense: {notification.metadata.expense_id}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {notification.action_url && (
                              <Button size="sm" variant="outline" className="text-xs">
                                <Zap className="h-3 w-3 mr-1" />
                                Take Action
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                archiveNotification(notification.id);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { NotificationCenter };
export default NotificationCenter;
