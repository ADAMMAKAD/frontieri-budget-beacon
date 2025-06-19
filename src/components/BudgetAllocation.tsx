
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Plus, PieChart, DollarSign, Search, Filter, SortAsc, SortDesc } from 'lucide-react';

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
  const [filteredCategories, setFilteredCategories] = useState<BudgetCategory[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    allocated_amount: ''
  });
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'allocated' | 'spent' | 'utilization'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterBy, setFilterBy] = useState<'all' | 'underutilized' | 'overutilized' | 'fully-utilized'>('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchCategories(selectedProject);
    }
  }, [selectedProject]);

  // Apply search and filters whenever categories or filter criteria change
  useEffect(() => {
    applyFiltersAndSearch();
  }, [categories, searchTerm, sortBy, sortOrder, filterBy, minAmount, maxAmount]);

  const fetchProjects = async () => {
    try {
      const response = await apiClient.getProjects();
      const projects = response.projects || [];
      setProjects(projects);
      if (projects.length > 0 && !selectedProject) {
        setSelectedProject(projects[0].id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive"
      });
    }
  };

  const fetchCategories = async (projectId: string) => {
    try {
      const response = await apiClient.getBudgetCategories(projectId);
      const categories = response.data || response.categories || response || [];
      setCategories(Array.isArray(categories) ? categories : []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch budget categories",
        variant: "destructive"
      });
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

    try {
      await apiClient.createBudgetCategory({
        project_id: selectedProject,
        name: newCategory.name,
        allocated_amount: parseFloat(newCategory.allocated_amount)
      });

      toast({
        title: "Success",
        description: "Budget category created successfully"
      });
      setIsCreating(false);
      setNewCategory({ name: '', allocated_amount: '' });
      fetchCategories(selectedProject);
      
      // Update project allocated budget
      const totalAllocated = categories.reduce((sum, cat) => sum + (parseFloat(cat.allocated_amount) || 0), 0) + parseFloat(newCategory.allocated_amount);
      await apiClient.updateProject(selectedProject, {
        allocated_budget: totalAllocated
      });
      
      fetchProjects();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create budget category",
        variant: "destructive"
      });
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...categories];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply amount range filter
    if (minAmount) {
      filtered = filtered.filter(category => category.allocated_amount >= parseFloat(minAmount));
    }
    if (maxAmount) {
      filtered = filtered.filter(category => category.allocated_amount <= parseFloat(maxAmount));
    }

    // Apply utilization filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(category => {
        const utilization = category.allocated_amount > 0 ? (category.spent_amount / category.allocated_amount) : 0;
        switch (filterBy) {
          case 'underutilized':
            return utilization < 0.7; // Less than 70% utilized
          case 'overutilized':
            return utilization > 1.0; // Over 100% utilized
          case 'fully-utilized':
            return utilization >= 0.9 && utilization <= 1.0; // 90-100% utilized
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'allocated':
          aValue = a.allocated_amount;
          bValue = b.allocated_amount;
          break;
        case 'spent':
          aValue = a.spent_amount;
          bValue = b.spent_amount;
          break;
        case 'utilization':
          aValue = a.allocated_amount > 0 ? (a.spent_amount / a.allocated_amount) : 0;
          bValue = b.allocated_amount > 0 ? (b.spent_amount / b.allocated_amount) : 0;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredCategories(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('name');
    setSortOrder('asc');
    setFilterBy('all');
    setMinAmount('');
    setMaxAmount('');
  };

  const selectedProjectData = projects.find(p => p.id === selectedProject);
  const totalAllocated = categories.reduce((sum, cat) => sum + (parseFloat(cat.allocated_amount) || 0), 0);
  const remainingBudget = selectedProjectData ? (parseFloat(selectedProjectData.total_budget) || 0) - totalAllocated : 0;

  // Filter projects to ensure no empty IDs
  const validProjects = projects.filter(project => project.id && project.id.trim() !== '');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Budget Allocation</h2>
          <p className="text-gray-600 mt-1">Allocate budget across different categories</p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-orange-600 to-red-600"
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
              {validProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name} - {formatCurrency(project.total_budget || 0)}
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
                <DollarSign className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Budget</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedProjectData.total_budget || 0)}</p>
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
                  <p className="text-2xl font-bold">{formatCurrency(totalAllocated)}</p>
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
                  <p className="text-2xl font-bold">{formatCurrency(remainingBudget)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter Section */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter Categories
            </CardTitle>
            <CardDescription>Find and filter budget categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search categories by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Sort By */}
              <div className="space-y-2">
                <Label>Sort By</Label>
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="allocated">Allocated Amount</SelectItem>
                      <SelectItem value="spent">Spent Amount</SelectItem>
                      <SelectItem value="utilization">Utilization %</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Filter By Utilization */}
              <div className="space-y-2">
                <Label>Filter By Utilization</Label>
                <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="underutilized">Under-utilized (&lt;70%)</SelectItem>
                    <SelectItem value="fully-utilized">Fully Utilized (90-100%)</SelectItem>
                    <SelectItem value="overutilized">Over-utilized (&gt;100%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <Label>Min Amount</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Max Amount</Label>
                <Input
                  type="number"
                  placeholder="999999.99"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={clearFilters}>
                Clear All Filters
              </Button>
              <p className="text-sm text-gray-600">
                Showing {filteredCategories.length} of {categories.length} categories
              </p>
            </div>
          </CardContent>
        </Card>
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
                <Button type="submit" className="bg-gradient-to-r from-orange-600 to-red-600">
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

      {filteredCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Categories</CardTitle>
            <CardDescription>Current budget allocation breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredCategories.map((category) => {
                const utilization = category.allocated_amount > 0 ? (category.spent_amount / category.allocated_amount) * 100 : 0;
                const utilizationColor = utilization > 100 ? 'text-red-600' : utilization >= 90 ? 'text-green-600' : 'text-yellow-600';
                
                return (
                  <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium">{category.name}</h4>
                      <p className="text-sm text-gray-600">
                        Spent: {formatCurrency(category.spent_amount || 0)} of {formatCurrency(category.allocated_amount || 0)}
                      </p>
                      <p className={`text-sm font-medium ${utilizationColor}`}>
                        Utilization: {utilization.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(category.allocated_amount || 0)}</p>
                      <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${
                            utilization > 100 ? 'bg-red-500' : 
                            utilization >= 90 ? 'bg-green-500' : 
                            'bg-gradient-to-r from-orange-600 to-red-600'
                          }`}
                          style={{ 
                            width: `${Math.min(utilization, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedProject && categories.length > 0 && filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No categories match your filters</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search terms or filters</p>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
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
            className="bg-gradient-to-r from-orange-600 to-red-600"
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
