import React, { useState } from 'react';
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
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';

const monthlyData = [
  { month: "Jan", planned: 400000, actual: 380000, variance: -20000 },
  { month: "Feb", planned: 450000, actual: 420000, variance: -30000 },
  { month: "Mar", planned: 380000, actual: 410000, variance: 30000 },
  { month: "Apr", planned: 500000, actual: 485000, variance: -15000 },
  { month: "May", planned: 420000, actual: 445000, variance: 25000 },
  { month: "Jun", planned: 380000, actual: 365000, variance: -15000 },
];

const departmentData = [
  { name: "Engineering", budget: 850000, spent: 720000, color: "#DC2626" },
  { name: "Marketing", budget: 450000, spent: 380000, color: "#991B1B" },
  { name: "Operations", budget: 320000, spent: 290000, color: "#B91C1C" },
  { name: "Research", budget: 680000, spent: 640000, color: "#EF4444" },
  { name: "Sales", budget: 380000, spent: 340000, color: "#F87171" },
];

const trendData = [
  { period: "Q1 2023", budget: 1200000, actual: 1150000 },
  { period: "Q2 2023", budget: 1350000, actual: 1280000 },
  { period: "Q3 2023", budget: 1180000, actual: 1220000 },
  { period: "Q4 2023", budget: 1450000, actual: 1380000 },
  { period: "Q1 2024", budget: 1520000, actual: 1460000 },
  { period: "Q2 2024", budget: 1680000, actual: 1620000 },
];

export const EnhancedBudgetChart: React.FC = () => {
  const { formatCurrency, currency } = useCurrency();
  const [activeTab, setActiveTab] = useState("overview");

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
        <CardDescription>Comprehensive financial performance insights</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="departments" className="flex items-center space-x-2">
              <PieChartIcon className="h-4 w-4" />
              <span>Departments</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Trends</span>
            </TabsTrigger>
            <TabsTrigger value="variance" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Variance</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
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
          </TabsContent>

          <TabsContent value="departments" className="mt-6">
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
                        {Math.round((dept.spent / dept.budget) * 100)}% utilized
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: `${(dept.spent / dept.budget) * 100}%`,
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
          </TabsContent>

          <TabsContent value="trends" className="mt-6">
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
          </TabsContent>

          <TabsContent value="variance" className="mt-6">
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
