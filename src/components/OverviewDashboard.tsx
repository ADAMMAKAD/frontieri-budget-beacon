
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle, Settings } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
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
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white dark:from-orange-600 dark:to-orange-700">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome to Frontieri PBMS</h1>
            <p className="text-orange-100 text-lg">
              Project Budget Management System - Your centralized financial control center
            </p>
            <div className="mt-4 p-3 bg-white/10 rounded-lg">
              <p className="text-sm text-orange-100 mb-2">🔐 <strong>Admin Access:</strong></p>
              <p className="text-xs text-orange-200">
                Create an account with email: <code className="bg-white/20 px-1 rounded">admin@gmail.com</code> and password: <code className="bg-white/20 px-1 rounded">1234567890</code> to access the Admin Dashboard
              </p>
            </div>
          </div>
          {user?.email === 'admin@gmail.com' && (
            <Button 
              onClick={handleAdminAccess}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              variant="outline"
            >
              <Settings className="mr-2 h-4 w-4" />
              Admin Dashboard
            </Button>
          )}
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
            <DollarSign className="h-5 w-5 text-orange-600" />
            <span>Filtered Project Budget Status</span>
            {filteredProjects.length !== projects.length && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                {filteredProjects.length} of {projects.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Current budget allocation and spending across filtered projects</CardDescription>
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
    </div>
  );
}
