
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, BarChart3, PieChart, TrendingUp, Search, Grid, List, Calendar, Users, DollarSign, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie, LineChart, Line, AreaChart, Area } from 'recharts';

interface Project {
  id: string;
  name: string;
  total_budget: number;
  allocated_budget: number;
  spent_budget: number;
  status: string;
  start_date?: string;
  end_date?: string;
  manager_name?: string;
  business_unit_name?: string;
  team_size?: number;
}

interface BudgetCategory {
  id: string;
  name: string;
  allocated_amount: number;
  spent_amount: number;
  project_id?: string;
}

interface Expense {
  id: string;
  project_id: string;
  project_name: string;
  category_id: string;
  category_name: string;
  description: string;
  amount: number;
  expense_date: string;
  status: string;
  submitted_by_name: string;
  approved_by_name?: string;
}

interface Milestone {
  id: string;
  project_id: string;
  title: string;
  status: string;
  due_date: string;
  progress: number;
  created_by_name?: string;
}

interface ReportData {
  totalProjects: number;
  totalBudget: number;
  totalSpent: number;
  budgetUtilization: number;
  categories: BudgetCategory[];
  projects: Project[];
  expenses: Expense[];
  milestones: Milestone[];
  monthlySpending: Array<{ month: string; amount: number; budget: number }>;
  expensesByCategory: Array<{ name: string; amount: number; count: number }>;
  projectProgress: Array<{ name: string; progress: number; milestones: number }>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FFBB28', '#FF8042'];

const Reporting = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'charts' | 'grid'>('charts');
  const [reportData, setReportData] = useState<ReportData>({
    totalProjects: 0,
    totalBudget: 0,
    totalSpent: 0,
    budgetUtilization: 0,
    categories: [],
    projects: [],
    expenses: [],
    milestones: [],
    monthlySpending: [],
    expensesByCategory: [],
    projectProgress: []
  });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
    generateReport();
  }, []);

  // Regenerate report when selected project changes
  useEffect(() => {
    if (projects.length > 0) {
      generateReport();
    }
  }, [selectedProject]);

  useEffect(() => {
    generateReport();
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      const response = await apiClient.get('/projects?limit=1000');
      console.log('Projects API Response:', response);
      
      // The backend returns { projects: [...], total, page, limit }
      const projectsData = response.data?.projects || response.projects || [];
      console.log('Extracted projects data:', projectsData);
      
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects for filter",
        variant: "destructive"
      });
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      let projects, categories, expenses, milestones;

      // Fetch all data concurrently for better performance
      const promises = [];
      
      if (selectedProject !== 'all') {
        // Get specific project data
        promises.push(
          apiClient.get(`/projects/${selectedProject}`),
          apiClient.get(`/budget-categories?project_id=${selectedProject}`),
          apiClient.get(`/expenses/project/${selectedProject}?limit=1000`),
          apiClient.get(`/project-milestones?project_id=${selectedProject}`)
        );
      } else {
        // Get all data
        promises.push(
          apiClient.get('/projects?limit=1000'),
          apiClient.get('/budget-categories'),
          apiClient.get('/expenses?limit=1000'),
          apiClient.get('/project-milestones')
        );
      }

      const [projectsRes, categoriesRes, expensesRes, milestonesRes] = await Promise.all(promises);
      
      // Extract data from responses
      if (selectedProject !== 'all') {
        // For single project, wrap in array
        projects = projectsRes.data ? [projectsRes.data] : [];
      } else {
        // For all projects, extract from response
        projects = Array.isArray(projectsRes.data) ? projectsRes.data : 
                   projectsRes.data?.projects || [];
      }
      
      categories = Array.isArray(categoriesRes.data) ? categoriesRes.data : 
                   categoriesRes.data?.categories || [];
      expenses = Array.isArray(expensesRes.expenses) ? expensesRes.expenses :
                 Array.isArray(expensesRes.data) ? expensesRes.data : 
                 expensesRes.data?.expenses || [];
      milestones = Array.isArray(milestonesRes.data) ? milestonesRes.data : 
                   milestonesRes.data?.milestones || [];

      // Debug logging
      console.log('Report Data Debug:', {
        selectedProject,
        projectsCount: projects.length,
        categoriesCount: categories.length,
        expensesCount: expenses.length,
        milestonesCount: milestones.length,
        projectsData: projects,
        expensesData: expenses,
        categoriesData: categories,
        milestonesData: milestones
      });

      // Calculate basic metrics
      const totalBudget = projects.reduce((sum, p) => sum + parseFloat(p?.total_budget || 0), 0);
      const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e?.amount || 0), 0);
      
      // Generate monthly spending data
      const monthlySpending = generateMonthlySpendingData(expenses, projects);
      
      // Generate expenses by category
      const expensesByCategory = generateExpensesByCategoryData(expenses);
      
      // Generate project progress data
      const projectProgress = generateProjectProgressData(projects, milestones);
      
      setReportData({
        totalProjects: projects.length,
        totalBudget,
        totalSpent,
        budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
        categories: categories.map(cat => ({
          ...cat,
          allocated_amount: cat?.allocated_amount || 0,
          spent_amount: cat?.spent_amount || 0
        })),
        projects: projects.map(proj => ({
          ...proj,
          total_budget: proj?.total_budget || 0,
          spent_budget: proj?.spent_budget || 0,
          allocated_budget: proj?.allocated_budget || 0
        })),
        expenses: expenses.map(exp => ({
          ...exp,
          amount: exp?.amount || 0
        })),
        milestones: milestones || [],
        monthlySpending,
        expensesByCategory,
        projectProgress
      });
    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive"
      });
      // Set empty data to prevent white page
      setReportData({
        totalProjects: 0,
        totalBudget: 0,
        totalSpent: 0,
        budgetUtilization: 0,
        categories: [],
        projects: [],
        expenses: [],
        milestones: [],
        monthlySpending: [],
        expensesByCategory: [],
        projectProgress: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate monthly spending data
  const generateMonthlySpendingData = (expenses: Expense[], projects: Project[]) => {
    const monthlyData: { [key: string]: { amount: number; budget: number } } = {};
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      monthlyData[monthKey] = { amount: 0, budget: 0 };
    }
    
    // Aggregate expenses by month
    expenses.forEach(expense => {
      if (expense.expense_date) {
        const monthKey = expense.expense_date.slice(0, 7);
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].amount += expense.amount || 0;
        }
      }
    });
    
    // Calculate monthly budget allocation (total budget / 12)
    const monthlyBudgetAllocation = projects.reduce((sum, p) => sum + (p.total_budget || 0), 0) / 12;
    Object.keys(monthlyData).forEach(month => {
      monthlyData[month].budget = monthlyBudgetAllocation;
    });
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      amount: data.amount,
      budget: data.budget
    }));
  };

  // Helper function to generate expenses by category data
  const generateExpensesByCategoryData = (expenses: Expense[]) => {
    const categoryData: { [key: string]: { amount: number; count: number } } = {};
    
    expenses.forEach(expense => {
      const categoryName = expense.category_name || 'Uncategorized';
      if (!categoryData[categoryName]) {
        categoryData[categoryName] = { amount: 0, count: 0 };
      }
      categoryData[categoryName].amount += expense.amount || 0;
      categoryData[categoryName].count += 1;
    });
    
    return Object.entries(categoryData).map(([name, data]) => ({
      name,
      amount: data.amount,
      count: data.count
    })).sort((a, b) => b.amount - a.amount);
  };

  // Helper function to generate project progress data
  const generateProjectProgressData = (projects: Project[], milestones: Milestone[]) => {
    return projects.map(project => {
      const projectMilestones = milestones.filter(m => m.project_id === project.id);
      const avgProgress = projectMilestones.length > 0 
        ? projectMilestones.reduce((sum, m) => sum + (m.progress || 0), 0) / projectMilestones.length
        : 0;
      
      return {
        name: project.name,
        progress: avgProgress,
        milestones: projectMilestones.length
      };
    });
  };

  const exportReport = () => {
    const reportContent = `
COMPREHENSIVE PROJECT BUDGET MANAGEMENT REPORT
Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}

=== EXECUTIVE SUMMARY ===
- Total Projects: ${reportData.totalProjects}
- Total Budget Allocated: $${reportData.totalBudget.toLocaleString()}
- Total Amount Spent: $${reportData.totalSpent.toLocaleString()}
- Budget Utilization: ${reportData.budgetUtilization.toFixed(1)}%
- Remaining Budget: $${(reportData.totalBudget - reportData.totalSpent).toLocaleString()}
- Total Expenses Recorded: ${reportData.expenses.length}
- Total Milestones: ${reportData.milestones.length}

=== PROJECT DETAILS ===
${reportData.projects.map(proj => 
  `Project: ${proj.name}
  - Status: ${proj.status}
  - Manager: ${proj.manager_name || 'Not assigned'}
  - Business Unit: ${proj.business_unit_name || 'Not specified'}
  - Team Size: ${proj.team_size || 0} members
  - Budget: $${proj.total_budget?.toLocaleString() || 0}
  - Spent: $${proj.spent_budget?.toLocaleString() || 0}
  - Utilization: ${proj.total_budget ? ((proj.spent_budget || 0) / proj.total_budget * 100).toFixed(1) : 0}%
  - Start Date: ${proj.start_date ? new Date(proj.start_date).toLocaleDateString() : 'Not set'}
  - End Date: ${proj.end_date ? new Date(proj.end_date).toLocaleDateString() : 'Not set'}
`
).join('\n')}

=== BUDGET CATEGORIES ANALYSIS ===
${reportData.categories.map(cat => 
  `Category: ${cat.name}
  - Allocated: $${cat.allocated_amount.toLocaleString()}
  - Spent: $${cat.spent_amount.toLocaleString()}
  - Remaining: $${(cat.allocated_amount - cat.spent_amount).toLocaleString()}
  - Utilization: ${cat.allocated_amount > 0 ? ((cat.spent_amount / cat.allocated_amount) * 100).toFixed(1) : 0}%
`
).join('\n')}

=== EXPENSE BREAKDOWN BY CATEGORY ===
${reportData.expensesByCategory.map(cat => 
  `${cat.name}: $${cat.amount.toLocaleString()} (${cat.count} transactions)`
).join('\n')}

=== PROJECT PROGRESS & MILESTONES ===
${reportData.projectProgress.map(proj => 
  `${proj.name}: ${proj.progress.toFixed(1)}% complete (${proj.milestones} milestones)`
).join('\n')}

=== MONTHLY SPENDING TREND ===
${reportData.monthlySpending.map(month => 
  `${month.month}: $${month.amount.toLocaleString()} spent vs $${month.budget.toLocaleString()} budgeted`
).join('\n')}

=== RECENT EXPENSES (Last 10) ===
${reportData.expenses.slice(0, 10).map(exp => 
  `${new Date(exp.expense_date).toLocaleDateString()} - ${exp.project_name}
  Description: ${exp.description}
  Amount: $${exp.amount.toLocaleString()}
  Category: ${exp.category_name}
  Status: ${exp.status}
  Submitted by: ${exp.submitted_by_name}
`
).join('\n')}

=== RECOMMENDATIONS ===
${reportData.budgetUtilization < 50 
  ? "• Budget utilization is conservative. Consider reallocating unused funds to high-priority projects.\n• Review project timelines to ensure adequate spending pace."
  : reportData.budgetUtilization < 80 
  ? "• Budget utilization is healthy and on track.\n• Continue monitoring monthly spending trends."
  : reportData.budgetUtilization < 100
  ? "• Budget utilization is high. Monitor closely to avoid overruns.\n• Consider implementing stricter expense approval processes."
  : "• Budget has been exceeded. Immediate attention required.\n• Review all pending expenses and implement cost control measures."
}

=== REPORT METADATA ===
Report Scope: ${selectedProject === 'all' ? 'All Projects' : 'Single Project'}
Data Range: ${reportData.expenses.length > 0 ? 
  `${new Date(Math.min(...reportData.expenses.map(e => new Date(e.expense_date).getTime()))).toLocaleDateString()} to ${new Date(Math.max(...reportData.expenses.map(e => new Date(e.expense_date).getTime()))).toLocaleDateString()}` : 
  'No expense data available'
}
Generated by: Budget Management System
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprehensive-budget-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Comprehensive report exported successfully"
    });
  };

  const filteredProjects = (reportData.projects || []).filter(project =>
    project?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const chartData = (reportData.categories || []).map(cat => ({
    name: cat?.name || 'Unknown',
    allocated: cat?.allocated_amount || 0,
    spent: cat?.spent_amount || 0,
    utilization: (cat?.allocated_amount || 0) > 0 ? ((cat?.spent_amount || 0) / (cat?.allocated_amount || 0)) * 100 : 0
  }));

  const pieData = (reportData.categories || []).map(cat => ({
    name: cat?.name || 'Unknown',
    value: cat?.spent_amount || 0
  }));

  const projectStatusData = (reportData.projects || []).reduce((acc, project) => {
    const status = project?.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusChartData = Object.entries(projectStatusData).map(([status, count]) => ({
    name: status,
    value: count
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reporting</h2>
          <p className="text-gray-600 mt-1">Generate comprehensive budget reports and analytics</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'charts' ? 'default' : 'outline'}
            onClick={() => setViewMode('charts')}
            size="sm"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Charts
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            onClick={() => setViewMode('grid')}
            size="sm"
          >
            <Grid className="mr-2 h-4 w-4" />
            Grid
          </Button>
          <Button 
            onClick={exportReport}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Report Filter</CardTitle>
            <CardDescription>Select project scope for the report</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedProject} onValueChange={setSelectedProject} disabled={projectsLoading}>
              <SelectTrigger>
                <SelectValue placeholder={projectsLoading ? "Loading projects..." : "Select project scope"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projectsLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading projects...
                  </SelectItem>
                ) : (
                  Array.isArray(projects) ? projects.map((project) => (
                    <SelectItem key={project?.id || ''} value={project?.id || ''}>
                      {project?.name || 'Unknown Project'}
                    </SelectItem>
                  )) : []
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {viewMode === 'grid' && (
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Search Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold">{loading ? '...' : reportData.totalProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold">{loading ? '...' : `$${reportData.totalBudget.toLocaleString()}`}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold">{loading ? '...' : `$${reportData.totalSpent.toLocaleString()}`}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Utilization</p>
                <p className="text-2xl font-bold">{loading ? '...' : `${reportData.budgetUtilization.toFixed(1)}%`}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold">{loading ? '...' : reportData.expenses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Milestones</p>
                <p className="text-2xl font-bold">{loading ? '...' : reportData.milestones.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'charts' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Spending Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Monthly Spending Trend</CardTitle>
              <CardDescription>Actual spending vs budgeted amounts over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={reportData.monthlySpending}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Area dataKey="budget" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} name="Budget" />
                  <Area dataKey="amount" stackId="2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.8} name="Actual Spending" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Budget Categories Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Categories Performance</CardTitle>
              <CardDescription>Allocated vs Spent by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="allocated" fill="#8884d8" name="Allocated" />
                  <Bar dataKey="spent" fill="#82ca9d" name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Expense Distribution by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Distribution by Category</CardTitle>
              <CardDescription>Total expenses and transaction count by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    dataKey="amount"
                    data={reportData.expensesByCategory}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {reportData.expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [
                    `$${Number(value).toLocaleString()}`,
                    'Amount'
                  ]} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Project Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Project Progress Overview</CardTitle>
              <CardDescription>Progress percentage and milestone count by project</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.projectProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value, name) => [
                    name === 'Progress' ? `${Number(value).toFixed(1)}%` : value,
                    name
                  ]} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="progress" fill="#8884d8" name="Progress %" />
                  <Bar yAxisId="right" dataKey="milestones" fill="#82ca9d" name="Milestones" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Project Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Project Status Distribution</CardTitle>
              <CardDescription>Projects by current status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    dataKey="value"
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Projects Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Projects Overview</CardTitle>
              <CardDescription>
                Detailed project information ({filteredProjects.length} of {reportData.projects.length} projects)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Budget</TableHead>
                    <TableHead>Spent</TableHead>
                    <TableHead>Utilization</TableHead>
                    <TableHead>Team Size</TableHead>
                    <TableHead>Manager</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          project.status === 'active' ? 'bg-green-100 text-green-800' :
                          project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status}
                        </span>
                      </TableCell>
                      <TableCell>${project.total_budget?.toLocaleString() || 0}</TableCell>
                      <TableCell>${project.spent_budget?.toLocaleString() || 0}</TableCell>
                      <TableCell>
                        {project.total_budget ? 
                          `${((project.spent_budget || 0) / project.total_budget * 100).toFixed(1)}%` : 
                          '0%'
                        }
                      </TableCell>
                      <TableCell>{project.team_size || 0}</TableCell>
                      <TableCell>{project.manager_name || 'Not assigned'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Expenses Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
              <CardDescription>Latest expense transactions across all projects</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.expenses.slice(0, 10).map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{new Date(expense.expense_date).toLocaleDateString()}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.project_name}</TableCell>
                      <TableCell>{expense.category_name}</TableCell>
                      <TableCell>${expense.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          expense.status === 'approved' ? 'bg-green-100 text-green-800' :
                          expense.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {expense.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Categories Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Categories</CardTitle>
              <CardDescription>Category-wise budget breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Allocated</TableHead>
                    <TableHead>Spent</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Utilization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>${category.allocated_amount.toLocaleString()}</TableCell>
                      <TableCell>${category.spent_amount.toLocaleString()}</TableCell>
                      <TableCell>${(category.allocated_amount - category.spent_amount).toLocaleString()}</TableCell>
                      <TableCell>
                        {category.allocated_amount > 0 ? 
                          `${((category.spent_amount / category.allocated_amount) * 100).toFixed(1)}%` : 
                          '0%'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Milestones Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Project Milestones</CardTitle>
              <CardDescription>Upcoming and recent milestones across all projects</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Milestone</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.milestones.slice(0, 10).map((milestone) => (
                    <TableRow key={milestone.id}>
                      <TableCell className="font-medium">{milestone.title}</TableCell>
                      <TableCell>{reportData.projects.find(p => p.id === milestone.project_id)?.name || 'Unknown'}</TableCell>
                      <TableCell>{new Date(milestone.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                          milestone.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          milestone.status === 'not_started' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {milestone.status}
                        </span>
                      </TableCell>
                      <TableCell>{milestone.progress}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Report Summary</CardTitle>
          <CardDescription>Key insights and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">Budget Health</h4>
              <p className="text-sm text-blue-700 mt-1">
                {reportData.budgetUtilization < 50 
                  ? "Budget utilization is conservative. Consider reallocating unused funds."
                  : reportData.budgetUtilization < 80 
                  ? "Budget utilization is healthy and on track."
                  : reportData.budgetUtilization < 100
                  ? "Budget utilization is high. Monitor closely to avoid overruns."
                  : "Budget has been exceeded. Immediate attention required."
                }
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900">Financial Overview</h4>
              <p className="text-sm text-green-700 mt-1">
                Total budget allocated across {reportData.totalProjects} project(s) with 
                ${(reportData.totalBudget - reportData.totalSpent).toLocaleString()} remaining.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reporting;
