
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { Plus, DollarSign, TrendingUp, AlertTriangle, Settings } from 'lucide-react';
import { BudgetStatusIndicator } from '@/components/BudgetStatusIndicator';
import { useAuth } from '@/hooks/useAuth';

interface Project {
  id: string;
  name: string;
  total_budget: number;
  spent_budget: number;
  start_date?: string;
  end_date?: string;
  status: string;
  description?: string;
}

interface BudgetCategory {
  id: string;
  name: string;
  allocated_amount: number;
  spent_amount: number;
  project_id: string;
}

export const BudgetPlanning = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [thresholdDialogOpen, setThresholdDialogOpen] = useState(false);
  const [categoryData, setCategoryData] = useState({
    name: '',
    allocated_amount: 0,
    project_id: ''
  });
  const [budgetThresholds, setBudgetThresholds] = useState({
    warning: 80,
    danger: 100
  });
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const [projectsResult, categoriesResult] = await Promise.all([
        supabase.from('projects').select('*').order('name'),
        supabase.from('budget_categories').select('*').order('name')
      ]);

      if (projectsResult.error) {
        console.error('Projects error:', projectsResult.error);
        toast({
          title: "Error",
          description: "Failed to load projects",
          variant: "destructive"
        });
      } else {
        const validProjects = (projectsResult.data || []).filter(p => p.id && p.id.trim() !== '');
        setProjects(validProjects);
      }

      if (categoriesResult.error) {
        console.error('Categories error:', categoriesResult.error);
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive"
        });
      } else {
        setCategories(categoriesResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load budget data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create categories",
        variant: "destructive"
      });
      return;
    }

    if (!categoryData.name || !categoryData.project_id || categoryData.allocated_amount <= 0) {
      toast({
        title: "Error",
        description: "Please fill all fields with valid data",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('budget_categories')
        .insert([{
          name: categoryData.name,
          allocated_amount: categoryData.allocated_amount,
          project_id: categoryData.project_id,
          spent_amount: 0
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Budget category created successfully"
      });

      setCategoryData({ name: '', allocated_amount: 0, project_id: '' });
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: "Failed to create budget category",
        variant: "destructive"
      });
    }
  };

  const filteredCategories = selectedProject 
    ? categories.filter(cat => cat.project_id === selectedProject)
    : categories;

  const getSelectedProjectData = () => {
    return projects.find(p => p.id === selectedProject);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access budget planning.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Budget Planning</h2>
          <p className="text-gray-600 mt-1">Plan and allocate budgets across projects and categories</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={thresholdDialogOpen} onOpenChange={setThresholdDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Budget Thresholds
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configure Budget Thresholds</DialogTitle>
                <DialogDescription>
                  Set warning and danger thresholds for budget utilization alerts
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="warning">Warning Threshold (%)</Label>
                  <Input
                    id="warning"
                    type="number"
                    value={budgetThresholds.warning}
                    onChange={(e) => setBudgetThresholds(prev => ({ 
                      ...prev, 
                      warning: Number(e.target.value) 
                    }))}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="danger">Danger Threshold (%)</Label>
                  <Input
                    id="danger"
                    type="number"
                    value={budgetThresholds.danger}
                    onChange={(e) => setBudgetThresholds(prev => ({ 
                      ...prev, 
                      danger: Number(e.target.value) 
                    }))}
                    min="0"
                    max="200"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setThresholdDialogOpen(false)}>
                  Save Thresholds
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Budget Category</DialogTitle>
                <DialogDescription>
                  Add a new budget category for better expense tracking
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select
                    value={categoryData.project_id}
                    onValueChange={(value) => setCategoryData(prev => ({ ...prev, project_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    value={categoryData.name}
                    onChange={(e) => setCategoryData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Marketing, Development, Operations"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Allocated Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={categoryData.allocated_amount}
                    onChange={(e) => setCategoryData(prev => ({ ...prev, allocated_amount: Number(e.target.value) }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCategory} className="bg-orange-600 hover:bg-orange-700">
                  Create Category
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Project Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Project</CardTitle>
          <CardDescription>Select a project to view its budget categories</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Selected Project Overview */}
      {selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span>Project Budget Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const projectData = getSelectedProjectData();
              if (!projectData) return null;
              
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                      <p className="text-2xl font-bold">{formatCurrency(projectData.total_budget)}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Spent Amount</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(projectData.spent_budget)}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Remaining</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {formatCurrency(projectData.total_budget - projectData.spent_budget)}
                      </p>
                    </div>
                  </div>
                  
                  <BudgetStatusIndicator
                    totalBudget={projectData.total_budget}
                    spentBudget={projectData.spent_budget}
                    startDate={projectData.start_date}
                    endDate={projectData.end_date}
                    thresholds={budgetThresholds}
                    showPercentage={true}
                  />
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Budget Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            <span>Budget Categories</span>
          </CardTitle>
          <CardDescription>
            {selectedProject 
              ? `Categories for ${projects.find(p => p.id === selectedProject)?.name}`
              : 'All budget categories across projects'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <p>No budget categories found.</p>
              <p className="text-sm">Create your first category to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCategories.map((category) => {
                const utilization = category.allocated_amount > 0 
                  ? (category.spent_amount / category.allocated_amount) * 100 
                  : 0;
                
                return (
                  <div key={category.id} className="p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{category.name}</h4>
                      <Badge variant={utilization > 100 ? "destructive" : utilization > 80 ? "secondary" : "default"}>
                        {utilization.toFixed(1)}% used
                      </Badge>
                    </div>
                    
                    <BudgetStatusIndicator
                      totalBudget={category.allocated_amount}
                      spentBudget={category.spent_amount}
                      thresholds={budgetThresholds}
                      showPercentage={false}
                    />
                    
                    <Progress value={Math.min(utilization, 100)} className="h-2 mt-2" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
