
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Building2, DollarSign, FileText } from 'lucide-react';
import { UserManagement } from './admin/UserManagement';
import { SystemSettings } from './admin/SystemSettings';
import { AdminProjects } from './admin/AdminProjects';
import { AdminExpenses } from './admin/AdminExpenses';
import { AdminBusinessUnits } from './admin/AdminBusinessUnits';
import { AdminActivityLog } from './admin/AdminActivityLog';
import { apiService } from '@/services/api';

interface DashboardStats {
  totalUsers: number;
  activeProjects: number;
  totalBudget: number;
  pendingApprovals: number;
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeProjects: 0,
    totalBudget: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [usersResult, projectsResult, expensesResult] = await Promise.all([
        apiService.getUsers(),
        apiService.getProjects(),
        apiService.getExpenses()
      ]);

      const totalUsers = usersResult.data?.length || 0;
      
      const projects = projectsResult.data || [];
      const activeProjects = projects.filter(p => p.status === 'active').length;
      const totalBudget = projects.reduce((sum, p) => sum + (p.total_budget || 0), 0);
      
      const expenses = expensesResult.data || [];
      const pendingApprovals = expenses.filter(e => e.status === 'pending').length;

      setStats({
        totalUsers,
        activeProjects,
        totalBudget,
        pendingApprovals
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Complete system administration and management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '--' : stats.totalUsers}
            </div>
            <p className="text-xs text-muted-foreground">System users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '--' : stats.activeProjects}
            </div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '--' : `$${stats.totalBudget.toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '--' : stats.pendingApprovals}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="business-units">Units</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

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
