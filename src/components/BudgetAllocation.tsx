
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, PieChart, DollarSign } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  total_budget: number;
  allocated_budget: number;
}

interface BudgetCategory {
  id: string;
  project_id: string;
  name: string;
  allocated_amount: number;
  spent_amount: number;
}

const BudgetAllocation = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    allocated_amount: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchCategories(selectedProject);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, total_budget, allocated_budget')
      .order('name');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive"
      });
    } else {
      setProjects(data || []);
      if (data && data.length > 0 && !selectedProject) {
        setSelectedProject(data[0].id);
      }
    }
  };

  const fetchCategories = async (projectId: string) => {
    const { data, error } = await supabase
      .from('budget_categories')
      .select('*')
      .eq('project_id', projectId)
      .order('name');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch budget categories",
        variant: "destructive"
      });
    } else {
      setCategories(data || []);
    }
  };

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject) {
      toast({
        title: "Error",
        description: "Please select a project",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('budget_categories')
      .insert([{
        project_id: selectedProject,
        name: newCategory.name,
        allocated_amount: parseFloat(newCategory.allocated_amount)
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create budget category",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Budget category created successfully"
      });
      setIsCreating(false);
      setNewCategory({ name: '', allocated_amount: '' });
      fetchCategories(selectedProject);
      
      // Update project allocated budget
      const totalAllocated = categories.reduce((sum, cat) => sum + cat.allocated_amount, 0) + parseFloat(newCategory.allocated_amount);
      await supabase
        .from('projects')
        .update({ allocated_budget: totalAllocated })
        .eq('id', selectedProject);
      
      fetchProjects();
    }
  };

  const selectedProjectData = projects.find(p => p.id === selectedProject);
  const totalAllocated = categories.reduce((sum, cat) => sum + cat.allocated_amount, 0);
  const remainingBudget = selectedProjectData ? selectedProjectData.total_budget - totalAllocated : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Budget Allocation</h2>
          <p className="text-gray-600 mt-1">Allocate budget across different categories</p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
          disabled={!selectedProject}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Project</CardTitle>
          <CardDescription>Choose a project to manage its budget allocation</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name} - ${project.total_budget?.toLocaleString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProjectData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Budget</p>
                  <p className="text-2xl font-bold">${selectedProjectData.total_budget?.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <PieChart className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Allocated</p>
                  <p className="text-2xl font-bold">${totalAllocated.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Remaining</p>
                  <p className="text-2xl font-bold">${remainingBudget.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Add Budget Category</CardTitle>
            <CardDescription>Create a new budget category for the selected project</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createCategory} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">Category Name</Label>
                  <Input
                    id="categoryName"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Personnel, Equipment, Materials"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allocatedAmount">Allocated Amount</Label>
                  <Input
                    id="allocatedAmount"
                    type="number"
                    step="0.01"
                    value={newCategory.allocated_amount}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, allocated_amount: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600">
                  Add Category
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Categories</CardTitle>
            <CardDescription>Current budget allocation breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{category.name}</h4>
                    <p className="text-sm text-gray-600">
                      Spent: ${category.spent_amount?.toLocaleString()} of ${category.allocated_amount?.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${category.allocated_amount?.toLocaleString()}</p>
                    <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full" 
                        style={{ 
                          width: `${category.allocated_amount > 0 ? (category.spent_amount / category.allocated_amount) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedProject && categories.length === 0 && !isCreating && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PieChart className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No budget categories</h3>
          <p className="text-gray-600 mb-4">Add budget categories to allocate your project budget</p>
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      )}
    </div>
  );
};

export default BudgetAllocation;
