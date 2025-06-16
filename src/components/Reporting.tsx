import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, BarChart3, PieChart, TrendingUp, Search, Grid, List } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';

interface Project {
  id: string;
  name: string;
  total_budget: number;
  allocated_budget: number;
  spent_budget: number;
  status: string;
}

interface BudgetCategory {
  id: string;
  name: string;
  allocated_amount: number;
  spent_amount: number;
}

interface ReportData {
  totalProjects: number;
  totalBudget: number;
  totalSpent: number;
  budgetUtilization: number;
  categories: BudgetCategory[];
  projects: Project[];
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
    projects: []
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
    generateReport();
  }, []);

  useEffect(() => {
    generateReport();
  }, [selectedProject]);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('name');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive"
      });
    } else {
      setProjects(data || []);
    }
  };

  const generateReport = async () => {
    try {
      let projectsQuery = supabase.from('projects').select('*');
      let categoriesQuery = supabase.from('budget_categories').select('*');

      if (selectedProject !== 'all') {
        projectsQuery = projectsQuery.eq('id', selectedProject);
        categoriesQuery = categoriesQuery.eq('project_id', selectedProject);
      }

      const [projectsResult, categoriesResult] = await Promise.all([
        projectsQuery,
        categoriesQuery
      ]);

      if (projectsResult.error || categoriesResult.error) {
        throw new Error('Failed to fetch report data');
      }

      const projects = projectsResult.data || [];
      const categories = categoriesResult.data || [];

      const totalBudget = projects.reduce((sum, p) => sum + (p.total_budget || 0), 0);
      const totalSpent = projects.reduce((sum, p) => sum + (p.spent_budget || 0), 0);
      
      setReportData({
        totalProjects: projects.length,
        totalBudget,
        totalSpent,
        budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
        categories,
        projects
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive"
      });
    }
  };

  const exportReport = () => {
    const reportContent = `
Project Budget Management Report
Generated on: ${new Date().toLocaleDateString()}

Summary:
- Total Projects: ${reportData.totalProjects}
- Total Budget: $${reportData.totalBudget.toLocaleString()}
- Total Spent: $${reportData.totalSpent.toLocaleString()}
- Budget Utilization: ${reportData.budgetUtilization.toFixed(1)}%

Budget Categories:
${reportData.categories.map(cat => 
  `- ${cat.name}: $${cat.spent_amount.toLocaleString()} / $${cat.allocated_amount.toLocaleString()} (${cat.allocated_amount > 0 ? ((cat.spent_amount / cat.allocated_amount) * 100).toFixed(1) : 0}%)`
).join('\n')}

Projects:
${reportData.projects.map(proj => 
  `- ${proj.name}: $${proj.spent_budget?.toLocaleString() || 0} / $${proj.total_budget?.toLocaleString() || 0} (${proj.status})`
).join('\n')}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Report exported successfully"
    });
  };

  const filteredProjects = reportData.projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const chartData = reportData.categories.map(cat => ({
    name: cat.name,
    allocated: cat.allocated_amount,
    spent: cat.spent_amount,
    utilization: cat.allocated_amount > 0 ? (cat.spent_amount / cat.allocated_amount) * 100 : 0
  }));

  const pieData = reportData.categories.map(cat => ({
    name: cat.name,
    value: cat.spent_amount
  }));

  const projectStatusData = reportData.projects.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
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
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Select project scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold">{reportData.totalProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold">${reportData.totalBudget.toLocaleString()}</p>
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
                <p className="text-2xl font-bold">${reportData.totalSpent.toLocaleString()}</p>
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
                <p className="text-2xl font-bold">{reportData.budgetUtilization.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'charts' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          {/* Spending Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Spending Distribution</CardTitle>
              <CardDescription>Budget allocation by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    dataKey="value"
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                </RechartsPieChart>
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

          {/* Budget Utilization */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Utilization by Category</CardTitle>
              <CardDescription>Percentage of budget used</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                  <Bar dataKey="utilization" fill="#ffc658" name="Utilization %" />
                </BarChart>
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
