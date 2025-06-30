
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, BarChart3, PieChart, TrendingUp, Search, Grid, List, Calendar, Users, DollarSign, Target, Filter, Activity, RefreshCw, Zap, FolderOpen, Brain, Lightbulb, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';
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
  total_spent: number;
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

interface AIInsight {
  id: string;
  type: 'risk' | 'opportunity' | 'recommendation' | 'prediction';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
  category: string;
}

interface AIAnalysis {
  overallHealth: {
    score: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    summary: string;
  };
  insights: AIInsight[];
  predictions: {
    budgetForecast: {
      projectedSpend: number;
      completionDate: string;
      riskLevel: 'low' | 'medium' | 'high';
    };
    milestoneCompletion: {
      onTimeCompletion: number;
      delayRisk: number;
    };
  };
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    expectedImpact: string;
  }[];
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
  aiAnalysis?: AIAnalysis;
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
      const response = await apiClient.getProjects({ limit: 1000 });
      console.log('🔍 Projects API Response:', response);
      
      // Handle different response formats like BudgetPlanning
      let projectsArray: Project[] = [];
      
      if (Array.isArray(response)) {
        projectsArray = response;
      } else if (response.projects && Array.isArray(response.projects)) {
        projectsArray = response.projects;
      } else if (response.data) {
        if (Array.isArray(response.data)) {
          projectsArray = response.data;
        } else if (response.data.projects && Array.isArray(response.data.projects)) {
          projectsArray = response.data.projects;
        }
      }
      
      console.log('🔍 Extracted projects data:', projectsArray);
      setProjects(projectsArray);
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
          apiClient.getProject(selectedProject),
          apiClient.getBudgetCategories(selectedProject),
          apiClient.getProjectExpenses(selectedProject, { limit: 1000 }),
          apiClient.get(`/api/project-milestones?project_id=${selectedProject}`)
        );
      } else {
        // Get all data
        promises.push(
          apiClient.getProjects({ limit: 1000 }),
          apiClient.getBudgetCategories(),
          apiClient.getExpenses({ limit: 1000 }),
          apiClient.get('/api/project-milestones')
        );
      }

      const [projectsRes, categoriesRes, expensesRes, milestonesRes] = await Promise.all(promises);
      
      // Extract data from responses based on actual API structures
      if (selectedProject !== 'all') {
        // For single project, wrap in array
        projects = projectsRes.data ? [projectsRes.data] : [];
      } else {
        // For all projects: API returns { projects: [...], total, page, limit }
        projects = projectsRes.projects || [];
      }
      
      // Budget categories: API returns array directly or { data: [...] }
      categories = Array.isArray(categoriesRes.data) ? categoriesRes.data : 
                   categoriesRes.data?.categories || categoriesRes.categories || [];
      
      // Expenses: API returns { expenses: [...], total, page, limit }
      expenses = expensesRes.expenses || [];
      
      // Milestones: API returns { data: [...], total, page, limit }
      milestones = milestonesRes.data || [];

      // Enhanced debug logging
      console.log('🔍 API Responses Raw:', {
        projectsRes: projectsRes,
        categoriesRes: categoriesRes,
        expensesRes: expensesRes,
        milestonesRes: milestonesRes
      });
      
      console.log('📊 Extracted Data:', {
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
      
      // Log budget calculations
      const totalBudgetCalc = projects.reduce((sum, p) => {
        const budget = parseFloat(p?.total_budget || 0);
        console.log(`Project ${p?.name}: budget = ${budget}`);
        return sum + budget;
      }, 0);
      
      const totalSpentCalc = expenses.reduce((sum, e) => {
        const amount = parseFloat(e?.amount || 0);
        console.log(`Expense ${e?.description}: amount = ${amount}`);
        return sum + amount;
      }, 0);
      
      console.log('💰 Budget Calculations:', {
        totalBudgetCalc,
        totalSpentCalc,
        projectsWithBudgets: projects.filter(p => p?.total_budget > 0),
        expensesWithAmounts: expenses.filter(e => e?.amount > 0)
      });

      // Calculate basic metrics using the debug calculated values
      const totalBudget = totalBudgetCalc;
      const totalSpent = totalSpentCalc;
      
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
          total_spent: cat?.total_spent || 0
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
        projectProgress,
        aiAnalysis: selectedProject !== 'all' && projects.length > 0 ? generateAIAnalysis(projects[0], expenses, milestones, categories) : undefined
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
      const projectMilestones = milestones.filter(m => m.project_id === project?.id);
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

  // AI Analysis Generation Function
  const generateAIAnalysis = (project: Project, expenses: Expense[], milestones: Milestone[], categories: BudgetCategory[]): AIAnalysis => {
    // Safety checks for project properties
    const totalBudget = project?.total_budget || 0;
    const spentBudget = project?.spent_budget || 0;
    const budgetUtilization = totalBudget > 0 ? spentBudget / totalBudget * 100 : 0;
    const remainingBudget = totalBudget - spentBudget;
    const projectMilestones = milestones.filter(m => m.project_id === project?.id);
    const completedMilestones = projectMilestones.filter(m => m.status === 'completed').length;
    const totalMilestones = projectMilestones.length;
    const avgProgress = projectMilestones.length > 0 ? projectMilestones.reduce((sum, m) => sum + (m.progress || 0), 0) / projectMilestones.length : 0;
    
    // Calculate project health score
    let healthScore = 100;
    if (budgetUtilization > 90) healthScore -= 30;
    else if (budgetUtilization > 80) healthScore -= 15;
    if (avgProgress < 50 && budgetUtilization > 60) healthScore -= 20;
    if (totalMilestones > 0 && completedMilestones / totalMilestones < 0.3) healthScore -= 15;
    
    const healthStatus = healthScore >= 80 ? 'excellent' : healthScore >= 60 ? 'good' : healthScore >= 40 ? 'warning' : 'critical';
    
    // Generate insights
    const insights: AIInsight[] = [];
    
    // Budget insights
    if (budgetUtilization > 85) {
      insights.push({
        id: 'budget-risk-1',
        type: 'risk',
        title: 'High Budget Utilization',
        description: `Project has utilized ${budgetUtilization.toFixed(1)}% of allocated budget. Risk of budget overrun is high.`,
        impact: 'high',
        confidence: 0.9,
        actionable: true,
        category: 'Budget Management'
      });
    } else if (budgetUtilization < 30 && avgProgress > 50) {
      insights.push({
        id: 'budget-opp-1',
        type: 'opportunity',
        title: 'Budget Efficiency Opportunity',
        description: `Project is ahead of schedule with only ${budgetUtilization.toFixed(1)}% budget used. Consider reallocating excess funds.`,
        impact: 'medium',
        confidence: 0.8,
        actionable: true,
        category: 'Resource Optimization'
      });
    }
    
    // Milestone insights
    if (totalMilestones > 0) {
      const completionRate = completedMilestones / totalMilestones * 100;
      if (completionRate < 30 && budgetUtilization > 50) {
        insights.push({
          id: 'milestone-risk-1',
          type: 'risk',
          title: 'Milestone Delivery Risk',
          description: `Only ${completionRate.toFixed(1)}% of milestones completed while ${budgetUtilization.toFixed(1)}% of budget is used.`,
          impact: 'high',
          confidence: 0.85,
          actionable: true,
          category: 'Project Delivery'
        });
      }
    }
    
    // Expense pattern insights
    const recentExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.expense_date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return expenseDate >= thirtyDaysAgo;
    });
    
    if (recentExpenses.length > 0) {
      const recentSpend = recentExpenses.reduce((sum, e) => sum + e.amount, 0);
      const monthlyBurnRate = recentSpend;
      const projectedMonthsToCompletion = remainingBudget / monthlyBurnRate;
      
      if (projectedMonthsToCompletion < 2 && avgProgress < 80) {
        insights.push({
          id: 'burn-rate-risk-1',
          type: 'prediction',
          title: 'Accelerated Burn Rate',
          description: `Current spending rate suggests budget depletion in ${projectedMonthsToCompletion.toFixed(1)} months.`,
          impact: 'high',
          confidence: 0.75,
          actionable: true,
          category: 'Financial Forecasting'
        });
      }
    }
    
    // Generate recommendations
    const recommendations = [];
    
    if (budgetUtilization > 80) {
      recommendations.push({
        priority: 'high' as const,
        action: 'Implement immediate cost control measures and review remaining scope',
        expectedImpact: 'Prevent budget overrun and maintain project viability'
      });
    }
    
    if (avgProgress < 50 && budgetUtilization > 60) {
      recommendations.push({
        priority: 'high' as const,
        action: 'Reassess project timeline and resource allocation',
        expectedImpact: 'Improve delivery predictability and resource efficiency'
      });
    }
    
    if (totalMilestones > 0 && completedMilestones / totalMilestones < 0.5) {
      recommendations.push({
        priority: 'medium' as const,
        action: 'Focus on milestone completion and remove blockers',
        expectedImpact: 'Accelerate project progress and improve stakeholder confidence'
      });
    }
    
    // Calculate predictions
    const currentDate = new Date();
    const projectedCompletion = new Date(currentDate.getTime() + (avgProgress > 0 ? (100 - avgProgress) / avgProgress * 30 * 24 * 60 * 60 * 1000 : 90 * 24 * 60 * 60 * 1000));
    
    return {
      overallHealth: {
        score: Math.round(healthScore),
        status: healthStatus,
        summary: `Project health score is ${Math.round(healthScore)}/100. ${healthStatus === 'excellent' ? 'Project is performing exceptionally well.' : healthStatus === 'good' ? 'Project is on track with minor areas for improvement.' : healthStatus === 'warning' ? 'Project requires attention to prevent issues.' : 'Project needs immediate intervention.'}`
      },
      insights,
      predictions: {
        budgetForecast: {
          projectedSpend: totalBudget * (avgProgress > 0 ? 100 / avgProgress : 1.2),
          completionDate: projectedCompletion.toISOString().split('T')[0],
          riskLevel: budgetUtilization > 80 ? 'high' : budgetUtilization > 60 ? 'medium' : 'low'
        },
        milestoneCompletion: {
          onTimeCompletion: Math.max(0, 100 - (budgetUtilization > avgProgress ? (budgetUtilization - avgProgress) * 2 : 0)),
          delayRisk: budgetUtilization > avgProgress ? Math.min(100, (budgetUtilization - avgProgress) * 2) : 0
        }
      },
      recommendations
    };
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
  - Spent: $${cat.total_spent.toLocaleString()}
  - Remaining: $${(cat.allocated_amount - cat.total_spent).toLocaleString()}
  - Utilization: ${cat.allocated_amount > 0 ? ((cat.total_spent / cat.allocated_amount) * 100).toFixed(1) : 0}%
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
    spent: cat?.total_spent || 0,
    utilization: (cat?.allocated_amount || 0) > 0 ? ((cat?.total_spent || 0) / (cat?.allocated_amount || 0)) * 100 : 0
  }));

  const pieData = (reportData.categories || []).map(cat => ({
    name: cat?.name || 'Unknown',
    value: cat?.total_spent || 0
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
    <div className="p-6 space-y-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-orange-600 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
            Advanced Reporting & Analytics
          </h2>
          <p className="text-gray-600 text-lg">Generate comprehensive budget reports with real-time data insights</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant={viewMode === 'charts' ? 'default' : 'outline'}
            onClick={() => setViewMode('charts')}
            className={`transition-all duration-300 ${viewMode === 'charts' 
              ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg' 
              : 'border-orange-300 text-orange-600 hover:bg-orange-50'}`}
            size="lg"
          >
            <BarChart3 className="mr-2 h-5 w-5" />
            Analytics Dashboard
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            onClick={() => setViewMode('grid')}
            className={`transition-all duration-300 ${viewMode === 'grid' 
              ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg' 
              : 'border-orange-300 text-orange-600 hover:bg-orange-50'}`}
            size="lg"
          >
            <Grid className="mr-2 h-5 w-5" />
            Data Tables
          </Button>
          <Button 
            onClick={exportReport}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg transition-all duration-300 transform hover:scale-105"
            size="lg"
          >
            <Download className="mr-2 h-5 w-5" />
            Export Comprehensive Report
          </Button>
          <Button 
            onClick={generateReport}
            disabled={loading}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg transition-all duration-300"
            size="lg"
          >
            {loading ? (
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Zap className="mr-2 h-5 w-5" />
            )}
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
            <CardTitle className="text-orange-700 font-bold flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Report Scope Filter
            </CardTitle>
            <CardDescription>Select project scope for comprehensive analysis</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Select value={selectedProject} onValueChange={setSelectedProject} disabled={projectsLoading}>
              <SelectTrigger className="border-orange-200 focus:border-orange-400">
                <SelectValue placeholder={projectsLoading ? "Loading projects..." : "Select project scope"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-medium">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-orange-600" />
                    All Projects (Global View)
                  </div>
                </SelectItem>
                {projectsLoading ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading projects...
                    </div>
                  </SelectItem>
                ) : (
                  Array.isArray(projects) ? projects.map((project) => (
                    <SelectItem key={project?.id || ''} value={project?.id || ''}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        {project?.name || 'Unknown Project'}
                      </div>
                    </SelectItem>
                  )) : []
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {viewMode === 'grid' && (
          <Card className="border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
              <CardTitle className="text-orange-700 font-bold flex items-center gap-2">
                <Search className="h-5 w-5" />
                Smart Search
              </CardTitle>
              <CardDescription>Find specific projects instantly</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 h-5 w-5" />
                <Input
                  placeholder="Search projects by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
            <CardTitle className="text-orange-700 font-bold flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-Time Status
            </CardTitle>
            <CardDescription>Live data synchronization</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                <span className="text-sm font-medium">
                  {loading ? 'Syncing...' : 'Data Current'}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <Card className="border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-orange-50 to-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-orange-700">Total Projects</p>
                <p className="text-3xl font-bold text-orange-600">{loading ? '...' : reportData.totalProjects}</p>
                <div className="flex items-center text-xs text-orange-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Active Portfolio
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-700">Total Budget</p>
                <p className="text-3xl font-bold text-green-600">{loading ? '...' : `$${reportData.totalBudget.toLocaleString()}`}</p>
                <div className="flex items-center text-xs text-green-600">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Allocated Funds
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-red-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-700">Total Spent</p>
                <p className="text-3xl font-bold text-red-600">{loading ? '...' : `$${reportData.totalSpent.toLocaleString()}`}</p>
                <div className="flex items-center text-xs text-red-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Expenses Recorded
                </div>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingUp className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-purple-700">Budget Utilization</p>
                <p className="text-3xl font-bold text-purple-600">{loading ? '...' : `${reportData.budgetUtilization.toFixed(1)}%`}</p>
                <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(reportData.budgetUtilization, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <PieChart className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-700">Total Expenses</p>
                <p className="text-3xl font-bold text-blue-600">{loading ? '...' : reportData.expenses.length}</p>
                <div className="flex items-center text-xs text-blue-600">
                  <FileText className="h-3 w-3 mr-1" />
                  Transactions
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-indigo-50 to-violet-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-indigo-700">Active Milestones</p>
                <p className="text-3xl font-bold text-indigo-600">{loading ? '...' : reportData.milestones.length}</p>
                <div className="flex items-center text-xs text-indigo-600">
                  <Target className="h-3 w-3 mr-1" />
                  Project Goals
                </div>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <Target className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'charts' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Spending Trend */}
          <Card className="lg:col-span-2 border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
              <CardTitle className="text-2xl font-bold text-orange-600 flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                Monthly Spending Analytics
              </CardTitle>
              <CardDescription className="text-gray-600">Real-time spending trends vs budgeted allocations with predictive insights</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={reportData.monthlySpending}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip 
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Area dataKey="budget" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.3} name="Monthly Budget" />
                  <Area dataKey="amount" stackId="2" stroke="#dc2626" fill="#dc2626" fillOpacity={0.8} name="Actual Spending" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Budget Categories Bar Chart */}
          <Card className="border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
              <CardTitle className="text-xl font-bold text-orange-600 flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                </div>
                Budget Categories Performance
              </CardTitle>
              <CardDescription className="text-gray-600">Allocated vs spent analysis by category</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#666" fontSize={11} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip 
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="allocated" fill="#3b82f6" name="Allocated" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="spent" fill="#f97316" name="Spent" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Expense Distribution by Category */}
          <Card className="border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
              <CardTitle className="text-xl font-bold text-orange-600 flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <PieChart className="h-5 w-5 text-orange-600" />
                </div>
                Expense Distribution Analytics
              </CardTitle>
              <CardDescription className="text-gray-600">Smart breakdown of expenses across all categories</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <RechartsPieChart>
                  <Pie
                    dataKey="amount"
                    data={reportData.expensesByCategory}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    fill="#8884d8"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {reportData.expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [
                      `$${Number(value).toLocaleString()}`,
                      'Amount'
                    ]} 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Project Progress Overview */}
          <Card className="border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
              <CardTitle className="text-xl font-bold text-orange-600 flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                Project Progress Overview
              </CardTitle>
              <CardDescription className="text-gray-600">Real-time completion status across all active projects</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={reportData.projectProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#666" fontSize={11} angle={-45} textAnchor="end" height={80} />
                  <YAxis yAxisId="left" orientation="left" stroke="#666" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="#666" fontSize={12} />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'Progress' ? `${Number(value).toFixed(1)}%` : value,
                      name
                    ]} 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="progress" fill="#f97316" name="Progress %" radius={[2, 2, 0, 0]} />
                  <Bar yAxisId="right" dataKey="milestones" fill="#3b82f6" name="Milestones" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Project Status Distribution */}
          <Card className="border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
              <CardTitle className="text-xl font-bold text-orange-600 flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Target className="h-5 w-5 text-orange-600" />
                </div>
                Project Status Distribution
              </CardTitle>
              <CardDescription className="text-gray-600">Comprehensive overview of project statuses and health metrics</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <RechartsPieChart>
                  <Pie
                    dataKey="value"
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    fill="#8884d8"
                    label={({ name, value }) => `${name}: ${value}`}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Projects Grid */}
          <Card className="border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
              <CardTitle className="text-2xl font-bold text-orange-600 flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FolderOpen className="h-6 w-6 text-orange-600" />
                </div>
                Projects Overview Dashboard
              </CardTitle>
              <CardDescription className="text-gray-600">
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
          <Card className="border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
              <CardTitle className="text-xl font-bold text-orange-600 flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                </div>
                Recent Expense Transactions
              </CardTitle>
              <CardDescription className="text-gray-600">Latest financial activities and expense tracking across all projects</CardDescription>
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
          <Card className="border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
              <CardTitle className="text-xl font-bold text-orange-600 flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Target className="h-5 w-5 text-orange-600" />
                </div>
                Budget Categories Performance
              </CardTitle>
              <CardDescription className="text-gray-600">Category-wise budget breakdown with utilization metrics</CardDescription>
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
                      <TableCell>${category.total_spent.toLocaleString()}</TableCell>
                      <TableCell>${(category.allocated_amount - category.total_spent).toLocaleString()}</TableCell>
                      <TableCell>
                        {category.allocated_amount > 0 ? 
                          `${((category.total_spent / category.allocated_amount) * 100).toFixed(1)}%` : 
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
          <Card className="border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
              <CardTitle className="text-xl font-bold text-orange-600 flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                Project Milestones Dashboard
              </CardTitle>
              <CardDescription className="text-gray-600">Comprehensive tracking of upcoming and completed milestones across all projects</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-orange-50">
                      <TableHead className="font-bold text-orange-700">Milestone</TableHead>
                      <TableHead className="font-bold text-orange-700">Project</TableHead>
                      <TableHead className="font-bold text-orange-700">Due Date</TableHead>
                      <TableHead className="font-bold text-orange-700">Status</TableHead>
                      <TableHead className="font-bold text-orange-700">Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.milestones.slice(0, 10).map((milestone) => (
                      <TableRow key={milestone.id} className="hover:bg-orange-50 transition-colors duration-200">
                        <TableCell className="font-semibold text-gray-800">{milestone.title}</TableCell>
                        <TableCell className="text-orange-600 font-medium">{milestone.project_name || 'Unknown'}</TableCell>
                        <TableCell className="text-gray-700">{new Date(milestone.due_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            milestone.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                            milestone.status === 'in-progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            milestone.status === 'not_started' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {milestone.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all duration-500" 
                                style={{ width: `${milestone.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700">{milestone.progress}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
          <CardTitle className="text-2xl font-bold text-orange-600 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            Executive Report Summary
          </CardTitle>
          <CardDescription className="text-gray-600">Comprehensive insights, key metrics, and strategic recommendations</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200 shadow-lg">
              <h4 className="font-bold text-lg text-orange-600 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget Health Analytics
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Utilization Rate:</span>
                  <span className={`font-bold ${
                    reportData.budgetUtilization < 50 ? 'text-blue-600' :
                    reportData.budgetUtilization < 80 ? 'text-green-600' :
                    reportData.budgetUtilization < 100 ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    {reportData.budgetUtilization.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      reportData.budgetUtilization < 50 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                      reportData.budgetUtilization < 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                      reportData.budgetUtilization < 100 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                      'bg-gradient-to-r from-red-400 to-red-600'
                    }`}
                    style={{ width: `${Math.min(reportData.budgetUtilization, 100)}%` }}
                  ></div>
                </div>
                <p className={`text-sm font-medium ${
                  reportData.budgetUtilization < 50 ? 'text-blue-700' :
                  reportData.budgetUtilization < 80 ? 'text-green-700' :
                  reportData.budgetUtilization < 100 ? 'text-orange-700' :
                  'text-red-700'
                }`}>
                  {reportData.budgetUtilization < 50 
                    ? "✓ Budget utilization is conservative. Consider reallocating unused funds."
                    : reportData.budgetUtilization < 80 
                    ? "✓ Budget utilization is healthy and on track."
                    : reportData.budgetUtilization < 100
                    ? "⚠ Budget utilization is high. Monitor closely to avoid overruns."
                    : "🚨 Budget has been exceeded. Immediate attention required."
                  }
                </p>
              </div>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-lg">
              <h4 className="font-bold text-lg text-blue-600 mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Financial Overview
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Total Projects:</span>
                  <span className="font-bold text-blue-600">{reportData.totalProjects}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Total Budget:</span>
                  <span className="font-bold text-gray-800">${reportData.totalBudget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Remaining:</span>
                  <span className="font-bold text-green-600">${(reportData.totalBudget - reportData.totalSpent).toLocaleString()}</span>
                </div>
                <div className="mt-4 p-3 bg-white rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-700 font-medium">
                    💡 Portfolio spans {reportData.totalProjects} active project(s) with strong financial health and 
                    ${(reportData.totalBudget - reportData.totalSpent).toLocaleString()} in available reserves.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Section - Only for Single Project */}
      {selectedProject !== 'all' && reportData.aiAnalysis && (
        <Card className="border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
            <CardTitle className="text-2xl font-bold text-purple-600 flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              AI-Powered Project Analysis
            </CardTitle>
            <CardDescription className="text-gray-600">Intelligent insights and predictive analytics for enhanced project management</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Overall Health Score */}
            <div className="mb-8 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-purple-700 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Project Health Score
                </h3>
                <div className={`text-3xl font-bold ${
                  reportData.aiAnalysis.overallHealth.status === 'excellent' ? 'text-green-600' :
                  reportData.aiAnalysis.overallHealth.status === 'good' ? 'text-blue-600' :
                  reportData.aiAnalysis.overallHealth.status === 'warning' ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {reportData.aiAnalysis.overallHealth.score}/100
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                <div 
                  className={`h-4 rounded-full transition-all duration-500 ${
                    reportData.aiAnalysis.overallHealth.status === 'excellent' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                    reportData.aiAnalysis.overallHealth.status === 'good' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                    reportData.aiAnalysis.overallHealth.status === 'warning' ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                    'bg-gradient-to-r from-red-400 to-red-600'
                  }`}
                  style={{ width: `${reportData.aiAnalysis.overallHealth.score}%` }}
                ></div>
              </div>
              <p className="text-gray-700 font-medium">{reportData.aiAnalysis.overallHealth.summary}</p>
            </div>

            {/* AI Insights */}
            {reportData.aiAnalysis.insights.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-purple-700 mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  AI Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportData.aiAnalysis.insights.map((insight) => (
                    <div key={insight.id} className={`p-4 rounded-lg border-l-4 ${
                      insight.type === 'risk' ? 'bg-red-50 border-red-400' :
                      insight.type === 'opportunity' ? 'bg-green-50 border-green-400' :
                      insight.type === 'recommendation' ? 'bg-blue-50 border-blue-400' :
                      'bg-purple-50 border-purple-400'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className={`font-semibold ${
                          insight.type === 'risk' ? 'text-red-700' :
                          insight.type === 'opportunity' ? 'text-green-700' :
                          insight.type === 'recommendation' ? 'text-blue-700' :
                          'text-purple-700'
                        }`}>
                          {insight.type === 'risk' && <AlertTriangle className="h-4 w-4 inline mr-1" />}
                          {insight.type === 'opportunity' && <TrendingUp className="h-4 w-4 inline mr-1" />}
                          {insight.type === 'recommendation' && <Lightbulb className="h-4 w-4 inline mr-1" />}
                          {insight.type === 'prediction' && <Brain className="h-4 w-4 inline mr-1" />}
                          {insight.title}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                          insight.impact === 'medium' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {insight.impact} impact
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{insight.description}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Category: {insight.category}</span>
                        <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Predictions */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-purple-700 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Predictive Analytics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Budget Forecast
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Projected Spend:</span>
                      <span className="font-medium">${reportData.aiAnalysis.predictions.budgetForecast.projectedSpend.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Est. Completion:</span>
                      <span className="font-medium">{new Date(reportData.aiAnalysis.predictions.budgetForecast.completionDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risk Level:</span>
                      <span className={`font-medium capitalize ${
                        reportData.aiAnalysis.predictions.budgetForecast.riskLevel === 'high' ? 'text-red-600' :
                        reportData.aiAnalysis.predictions.budgetForecast.riskLevel === 'medium' ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {reportData.aiAnalysis.predictions.budgetForecast.riskLevel}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Milestone Completion
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">On-Time Completion:</span>
                      <span className="font-medium text-green-600">{reportData.aiAnalysis.predictions.milestoneCompletion.onTimeCompletion.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delay Risk:</span>
                      <span className={`font-medium ${
                        reportData.aiAnalysis.predictions.milestoneCompletion.delayRisk > 50 ? 'text-red-600' :
                        reportData.aiAnalysis.predictions.milestoneCompletion.delayRisk > 25 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {reportData.aiAnalysis.predictions.milestoneCompletion.delayRisk.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {reportData.aiAnalysis.recommendations.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-purple-700 mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  AI Recommendations
                </h3>
                <div className="space-y-3">
                  {reportData.aiAnalysis.recommendations.map((rec, index) => (
                    <div key={index} className={`p-4 rounded-lg border-l-4 ${
                      rec.priority === 'high' ? 'bg-red-50 border-red-400' :
                      rec.priority === 'medium' ? 'bg-orange-50 border-orange-400' :
                      'bg-blue-50 border-blue-400'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className={`font-semibold ${
                          rec.priority === 'high' ? 'text-red-700' :
                          rec.priority === 'medium' ? 'text-orange-700' :
                          'text-blue-700'
                        }`}>
                          {rec.action}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                          rec.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {rec.priority} priority
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        <strong>Expected Impact:</strong> {rec.expectedImpact}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Reporting;
