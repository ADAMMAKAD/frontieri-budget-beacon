import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { apiClient } from '@/lib/api';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';

// Color palette for departments
const departmentColors = [
  "#DC2626", "#991B1B", "#B91C1C", "#EF4444", "#F87171",
  "#3B82F6", "#1D4ED8", "#1E40AF", "#2563EB", "#60A5FA",
  "#059669", "#047857", "#065F46", "#10B981", "#34D399",
  "#7C3AED", "#5B21B6", "#4C1D95", "#8B5CF6", "#A78BFA"
];

// Generate monthly data from real projects
const generateMonthlyData = (projects: any[]) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  
  return months.map(month => {
    const monthIndex = months.indexOf(month);
    
    // Get projects that started in this month OR are active during this month
    const monthProjects = projects.filter(p => {
      if (!p.start_date) return false;
      
      const startDate = new Date(p.start_date);
      const endDate = p.end_date ? new Date(p.end_date) : new Date();
      const monthStart = new Date(currentYear, monthIndex, 1);
      const monthEnd = new Date(currentYear, monthIndex + 1, 0);
      
      // Project is active if it overlaps with the month
      return (startDate <= monthEnd && endDate >= monthStart);
    });
    
    const planned = monthProjects.reduce((sum, p) => sum + (p.total_budget || 0), 0);
    const actual = monthProjects.reduce((sum, p) => {
      const progress = p.progress || 0;
      return sum + (p.total_budget * progress / 100);
    }, 0);
    
    return {
      month,
      planned,
      actual,
      variance: actual - planned
    };
  }).filter(monthData => monthData.planned > 0 || monthData.actual > 0); // Only show months with data
};

const generateTrendData = (projects: any[]) => {
  const quarters = [
    { period: 'Q1 2023', start: new Date('2023-01-01'), end: new Date('2023-03-31') },
    { period: 'Q2 2023', start: new Date('2023-04-01'), end: new Date('2023-06-30') },
    { period: 'Q3 2023', start: new Date('2023-07-01'), end: new Date('2023-09-30') },
    { period: 'Q4 2023', start: new Date('2023-10-01'), end: new Date('2023-12-31') },
    { period: 'Q1 2024', start: new Date('2024-01-01'), end: new Date('2024-03-31') },
    { period: 'Q2 2024', start: new Date('2024-04-01'), end: new Date('2024-06-30') },
    { period: 'Q3 2024', start: new Date('2024-07-01'), end: new Date('2024-09-30') },
    { period: 'Q4 2024', start: new Date('2024-10-01'), end: new Date('2024-12-31') }
  ];
  
  return quarters.map(quarter => {
    const quarterProjects = projects.filter(p => {
      const startDate = new Date(p.start_date);
      return startDate >= quarter.start && startDate <= quarter.end;
    });
    
    const budget = quarterProjects.reduce((sum, p) => sum + (p.total_budget || 0), 0);
    const actual = quarterProjects.reduce((sum, p) => {
      const progress = p.progress || 0;
      return sum + (p.total_budget * progress / 100);
    }, 0);
    
    return {
      period: quarter.period,
      budget,
      actual
    };
  }).filter(q => q.budget > 0 || q.actual > 0); // Only show quarters with data
};

interface BusinessUnit {
  id: string;
  name: string;
  description: string;
  total_budget: number;
  project_count: number;
  user_count: number;
}

interface DepartmentData {
  name: string;
  budget: number;
  spent: number;
  color: string;
}

export const EnhancedBudgetChart: React.FC = () => {
  const { formatCurrency, currency } = useCurrency();
  const [activeTab, setActiveTab] = useState("overview");
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch business units and their associated project data
      const [businessUnitsResponse, projectsResponse] = await Promise.all([
        apiClient.getBusinessUnits(),
        apiClient.getProjects()
      ]);
      
      const businessUnits: BusinessUnit[] = businessUnitsResponse.business_units || [];
      const projects = projectsResponse.projects || [];
      
      // Calculate budget and spending for each business unit
      const businessUnitStats = businessUnits.map((unit, index) => {
        const unitProjects = projects.filter(p => p.business_unit_id === unit.id);
        const totalBudget = unitProjects.reduce((sum, p) => sum + (p.total_budget || 0), 0);
        const totalSpent = unitProjects.reduce((sum, p) => {
          // Calculate spent amount based on project progress
          const progress = p.progress || 0;
          return sum + (p.total_budget * progress / 100);
        }, 0);
        
        return {
          name: unit.name,
          budget: totalBudget,
          spent: totalSpent,
          color: departmentColors[index % departmentColors.length]
        };
      }).filter(unit => unit.budget > 0); // Only include business units with budget
      
      // Generate monthly and trend data from real projects
      const monthlyStats = generateMonthlyData(projects);
      const trendStats = generateTrendData(projects);
      
      setDepartmentData(businessUnitStats);
      setMonthlyData(monthlyStats);
      setTrendData(trendStats);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Fallback to empty arrays if fetch fails
      setDepartmentData([]);
      setMonthlyData([]);
      setTrendData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatYAxisTick = (value: number) => {
    if (currency === 'USD') {
      return `$${(value / 1000).toLocaleString('en-US')}k`;
    } else {
      return `${(value / 1000).toLocaleString('en-US')}k ETB`;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-0 shadow-lg bg-card col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <span>Advanced Budget Analytics</span>
        </CardTitle>
        <CardDescription>Comprehensive financial performance insights by business units</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="departments">Business Units</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="variance">Variance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading overview data...</span>
              </div>
            ) : monthlyData.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-gray-500 text-lg">No monthly data available</p>
                  <p className="text-gray-400 text-sm mt-2">Create projects to see monthly budget analytics</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="stroke-muted-foreground" />
                  <YAxis className="stroke-muted-foreground" tickFormatter={formatYAxisTick} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="planned" fill="#3B82F6" name="Planned Budget" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" fill="#DC2626" name="Actual Spend" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </TabsContent>

          <TabsContent value="departments" className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading department data...</span>
              </div>
            ) : departmentData.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-gray-500 text-lg">No business unit data available</p>
                  <p className="text-gray-400 text-sm mt-2">Create business units and projects to see business unit analytics</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="budget"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Department Performance</h4>
                  {departmentData.map((dept, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{dept.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {dept.budget > 0 ? Math.round((dept.spent / dept.budget) * 100) : 0}% utilized
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full" 
                          style={{ 
                            width: `${dept.budget > 0 ? (dept.spent / dept.budget) * 100 : 0}%`,
                            backgroundColor: dept.color 
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Spent: {formatCurrency(dept.spent)}</span>
                        <span>Budget: {formatCurrency(dept.budget)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trends" className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading trend data...</span>
              </div>
            ) : trendData.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-gray-500 text-lg">No trend data available</p>
                  <p className="text-gray-400 text-sm mt-2">Create projects across multiple quarters to see trend analytics</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={formatYAxisTick} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="budget" 
                    stackId="1" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.3}
                    name="Budget"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="actual" 
                    stackId="2" 
                    stroke="#DC2626" 
                    fill="#DC2626" 
                    fillOpacity={0.3}
                    name="Actual"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </TabsContent>

          <TabsContent value="variance" className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading variance data...</span>
              </div>
            ) : monthlyData.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-gray-500 text-lg">No variance data available</p>
                  <p className="text-gray-400 text-sm mt-2">Create projects to see budget variance analytics</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={formatYAxisTick} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="variance" 
                    stroke="#DC2626" 
                    strokeWidth={3}
                    dot={{ fill: '#DC2626', strokeWidth: 2, r: 6 }}
                    name="Budget Variance"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
