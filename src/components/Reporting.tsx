
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
}

const Reporting = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [reportData, setReportData] = useState<ReportData>({
    totalProjects: 0,
    totalBudget: 0,
    totalSpent: 0,
    budgetUtilization: 0,
    categories: []
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
        categories
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
- Total Budget: R$${reportData.totalBudget.toLocaleString('pt-BR')}
- Total Spent: R$${reportData.totalSpent.toLocaleString('pt-BR')}
- Budget Utilization: ${reportData.budgetUtilization.toFixed(1)}%

Budget Categories:
${reportData.categories.map(cat => 
  `- ${cat.name}: R$${cat.spent_amount.toLocaleString('pt-BR')} / R$${cat.allocated_amount.toLocaleString('pt-BR')} (${cat.allocated_amount > 0 ? ((cat.spent_amount / cat.allocated_amount) * 100).toFixed(1) : 0}%)`
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reporting</h2>
          <p className="text-gray-600 mt-1">Generate comprehensive budget reports and analytics</p>
        </div>
        <Button 
          onClick={exportReport}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <Card>
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
                <p className="text-2xl font-bold">R${reportData.totalBudget.toLocaleString('pt-BR')}</p>
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
                <p className="text-2xl font-bold">R${reportData.totalSpent.toLocaleString('pt-BR')}</p>
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

      {reportData.categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Category Performance</CardTitle>
            <CardDescription>Detailed breakdown by budget category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{category.name}</h4>
                    <p className="text-sm text-gray-600">
                      R${category.spent_amount.toLocaleString('pt-BR')} of R${category.allocated_amount.toLocaleString('pt-BR')}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full" 
                        style={{ 
                          width: `${category.allocated_amount > 0 ? Math.min((category.spent_amount / category.allocated_amount) * 100, 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-semibold">
                      {category.allocated_amount > 0 ? ((category.spent_amount / category.allocated_amount) * 100).toFixed(1) : 0}%
                    </p>
                    <p className="text-sm text-gray-600">Utilized</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
                R${(reportData.totalBudget - reportData.totalSpent).toLocaleString('pt-BR')} remaining.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reporting;
