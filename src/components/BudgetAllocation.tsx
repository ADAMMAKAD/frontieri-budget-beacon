
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Plus, PieChart, DollarSign, Search, Filter, SortAsc, SortDesc, TrendingUp, AlertCircle, CheckCircle, Target, Sparkles, X, AlertTriangle } from 'lucide-react';

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
  total_spent: number;
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
        const utilization = category.allocated_amount > 0 ? (category.total_spent / category.allocated_amount) : 0;
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
          aValue = a.total_spent;
        bValue = b.total_spent;
          break;
        case 'utilization':
          aValue = a.allocated_amount > 0 ? (a.total_spent / a.allocated_amount) : 0;
        bValue = b.allocated_amount > 0 ? (b.total_spent / b.allocated_amount) : 0;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 p-6 space-y-8">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Budget Allocation
          </h1>
          <p className="text-gray-600 text-lg">Manage and allocate budgets across categories with advanced insights</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
            <div className="text-gray-600 text-sm">Active Categories</div>
          </div>
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 text-lg"
            disabled={!selectedProject}
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Category
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">

        {/* Enhanced Project Selection */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Project Selection */}
              <div className="md:col-span-2">
                <div className="space-y-2">
                  <Label htmlFor="project-select" className="text-sm font-medium text-gray-700">
                    Select Project
                  </Label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger className="pl-10 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20">
                        <SelectValue placeholder="Choose a project to manage its budget categories" />
                      </SelectTrigger>
                      <SelectContent>
                        {validProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{project.name}</span>
                              <Badge variant="secondary" className="ml-2">
                                {formatCurrency(project.total_budget || 0)}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Status Indicator */}
              <div className="flex justify-center">
                {selectedProject ? (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium text-sm">Project Active</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400 bg-gray-50 px-4 py-2 rounded-full">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium text-sm">Select Project</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedProjectData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Budget Card */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-blue-50 to-indigo-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">Total Budget</p>
                    <p className="text-3xl font-bold text-blue-900">{formatCurrency(selectedProjectData.total_budget || 0)}</p>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                      Project Capacity
                    </Badge>
                  </div>
                  <div className="p-4 bg-blue-500 rounded-xl shadow-lg">
                    <DollarSign className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Allocated Budget Card */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-green-50 to-emerald-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-600 uppercase tracking-wide">Allocated</p>
                    <p className="text-3xl font-bold text-green-900">{formatCurrency(totalAllocated)}</p>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                      {((totalAllocated / (selectedProjectData.total_budget || 1)) * 100).toFixed(1)}% Used
                    </Badge>
                  </div>
                  <div className="p-4 bg-green-500 rounded-xl shadow-lg">
                    <PieChart className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Remaining Budget Card */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-orange-50 to-amber-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-orange-600 uppercase tracking-wide">Remaining</p>
                    <p className="text-3xl font-bold text-orange-900">{formatCurrency(remainingBudget)}</p>
                    <Badge className={`${remainingBudget > 0 ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}>
                      {remainingBudget > 0 ? 'Available' : 'Over Budget'}
                    </Badge>
                  </div>
                  <div className={`p-4 rounded-xl shadow-lg ${remainingBudget > 0 ? 'bg-orange-500' : 'bg-red-500'}`}>
                    {remainingBudget > 0 ? 
                      <TrendingUp className="h-8 w-8 text-white" /> : 
                      <AlertCircle className="h-8 w-8 text-white" />
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Search and Filters */}
        {categories.length > 0 && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder="Search categories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                    />
                  </div>
                </div>
                
                {/* Sort By */}
                <div>
                  <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger className="flex-1 border-gray-200 focus:border-orange-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="allocated">Allocated</SelectItem>
                        <SelectItem value="spent">Spent</SelectItem>
                        <SelectItem value="utilization">Utilization</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-3 border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                {/* Filter By Utilization */}
                <div>
                  <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                    <SelectTrigger className="border-gray-200 focus:border-orange-500">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="underutilized">Under-utilized</SelectItem>
                      <SelectItem value="fully-utilized">Fully Utilized</SelectItem>
                      <SelectItem value="overutilized">Over-utilized</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Clear Filters */}
                <div>
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    Clear
                  </Button>
                </div>
              </div>
              
              {/* Amount Range Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Min Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="mt-1 border-gray-200 focus:border-orange-500"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Max Amount</Label>
                  <Input
                    type="number"
                    placeholder="999999.99"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="mt-1 border-gray-200 focus:border-orange-500"
                  />
                </div>
              </div>
              
              {/* Results Summary */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredCategories.length}</span> of <span className="font-semibold text-gray-900">{categories.length}</span> categories
                </div>
                {filteredCategories.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Live data</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {isCreating && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Add Budget Category</CardTitle>
              <CardDescription>Create a new budget category for this project</CardDescription>
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
                      placeholder="Enter category name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="allocatedAmount">Allocated Amount</Label>
                    <Input
                      id="allocatedAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newCategory.allocated_amount}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, allocated_amount: e.target.value }))}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Category
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreating(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Budget Categories */}
        {categories.length > 0 && (
          <div className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCategories.map((category, index) => {
                const utilization = category.allocated_amount > 0 
                  ? (category.total_spent / category.allocated_amount) * 100 
                  : 0;
                
                const getStatusColor = () => {
                  if (utilization > 100) return 'bg-red-100 text-red-800';
                  if (utilization > 80) return 'bg-yellow-100 text-yellow-800';
                  return 'bg-green-100 text-green-800';
                };
                
                return (
                  <Card 
                    key={category.id} 
                    className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-md bg-gradient-to-br from-white to-gray-50/50 overflow-hidden"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Status indicator bar */}
                    <div className={`h-1 w-full ${
                      utilization > 100 ? 'bg-gradient-to-r from-red-400 to-red-600' :
                      utilization > 80 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      'bg-gradient-to-r from-green-400 to-green-600'
                    }`} />
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2">
                            {category.name}
                          </CardTitle>
                          <CardDescription className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {category.description || 'No description provided'}
                          </CardDescription>
                        </div>
                        <Badge className={`${getStatusColor()} text-xs font-medium px-2 py-1 rounded-full`}>
                          {utilization > 100 ? 'Over Budget' : utilization > 80 ? 'Near Limit' : 'On Track'}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Budget Overview */}
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Budget Progress</span>
                          <span className={`text-sm font-bold ${
                            utilization > 100 ? 'text-red-600' :
                            utilization > 80 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {utilization.toFixed(1)}%
                          </span>
                        </div>
                        
                        {/* Enhanced Progress Bar */}
                        <div className="relative">
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                utilization > 100 ? 'bg-gradient-to-r from-red-400 to-red-600' :
                                utilization > 80 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 
                                'bg-gradient-to-r from-green-400 to-green-600'
                              }`}
                              style={{ width: `${Math.min(utilization, 100)}%` }}
                            />
                          </div>
                          {utilization > 100 && (
                            <div className="absolute -top-1 -right-1">
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Spent: {formatCurrency(category.total_spent)}</span>
                          <span>Total: {formatCurrency(category.allocated_amount)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {/* No Categories Message */}
            {filteredCategories.length === 0 && categories.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                    <PieChart className="h-12 w-12 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No categories match your filters
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your search or filter criteria to find what you're looking for
                  </p>
                  <Button 
                    onClick={clearFilters}
                    variant="outline"
                    className="border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
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
    </div>
  );
};

export default BudgetAllocation;
