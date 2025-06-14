
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import { BudgetChart } from "@/components/BudgetChart";
import { EnhancedBudgetChart } from "@/components/EnhancedBudgetChart";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { ProjectFilter } from "@/components/ProjectFilter";
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
  start_date?: string;
  team_id?: string;
}

interface Team {
  id: string;
  name: string;
}

export function OverviewDashboard() {
  const { formatCurrency } = useCurrency();
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsResponse, teamsResponse] = await Promise.all([
        supabase
          .from('projects')
          .select('id, name, total_budget, spent_budget, status, start_date, team_id'),
        supabase
          .from('business_units')
          .select('id, name')
      ]);

      if (projectsResponse.error) {
        console.error('Error fetching projects:', projectsResponse.error);
        setProjects([]);
      } else {
        setProjects(projectsResponse.data || []);
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
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedYear('all');
    setSelectedTeam('all');
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    const matchesYear = selectedYear === 'all' || 
      (project.start_date && new Date(project.start_date).getFullYear().toString() === selectedYear);
    const matchesTeam = selectedTeam === 'all' || project.team_id === selectedTeam;

    return matchesSearch && matchesStatus && matchesYear && matchesTeam;
  });

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

      {/* Enhanced Metrics Dashboard */}
      <DashboardMetrics />

      {/* Project Filters */}
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

      {/* Enhanced Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <EnhancedBudgetChart />
        <RecentActivity />
      </div>

      {/* Project Status */}
      <Card className="border-0 shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <span>Filtered Project Budget Status</span>
            {filteredProjects.length !== projects.length && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {filteredProjects.length} of {projects.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Current budget allocation and spending across filtered projects</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <p>No projects found matching the current filters. Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.slice(0, 6).map((project, index) => {
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
              {filteredProjects.length > 6 && (
                <div className="text-center p-4">
                  <p className="text-sm text-muted-foreground">
                    Showing 6 of {filteredProjects.length} filtered projects
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
