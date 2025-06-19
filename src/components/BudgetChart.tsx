
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";

const monthlyData = [
  { month: "Jan", planned: 400000, actual: 380000 },
  { month: "Feb", planned: 450000, actual: 420000 },
  { month: "Mar", planned: 380000, actual: 410000 },
  { month: "Apr", planned: 500000, actual: 485000 },
  { month: "May", planned: 420000, actual: 445000 },
  { month: "Jun", planned: 380000, actual: 365000 },
];

interface BusinessUnit {
  id: string;
  name: string;
  description: string;
}

export function BudgetChart() {
  const { formatCurrency, currency } = useCurrency();
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinessUnits();
  }, []);

  const fetchBusinessUnits = async () => {
    try {
      const data = await apiClient.get('/business-units?limit=5');
      setBusinessUnits(data || []);
    } catch (error) {
      console.error('Error fetching business units:', error);
      setBusinessUnits([]);
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

  // Generate colors for business units
  const colors = ['#DC2626', '#991B1B', '#B91C1C', '#EF4444', '#F87171'];
  
  const businessUnitData = businessUnits.map((unit, index) => ({
    name: unit.name,
    value: Math.floor(Math.random() * 30) + 10, // Random percentage for demo
    color: colors[index % colors.length]
  }));

  // If no business units, show fallback data
  const displayData = businessUnitData.length > 0 ? businessUnitData : [
    { name: "No Business Units", value: 100, color: "#DC2626" }
  ];

  return (
    <Card className="border-0 shadow-lg bg-card">
      <CardHeader>
        <CardTitle>Budget Performance</CardTitle>
        <CardDescription>Planned vs Actual spending over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" className="stroke-muted-foreground" />
            <YAxis className="stroke-muted-foreground" tickFormatter={formatYAxisTick} />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), ""]}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
              }}
            />
            <Bar dataKey="planned" fill="hsl(var(--muted))" name="Planned" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" fill="#DC2626" name="Actual" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-medium mb-4">Budget Distribution by Business Units</h4>
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <div className="flex items-center space-x-8">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={displayData}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={60}
                      dataKey="value"
                    >
                      {displayData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {displayData.map((unit, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: unit.color }}></div>
                      <span className="text-sm text-muted-foreground">{unit.name}</span>
                    </div>
                    <span className="text-sm font-medium">{unit.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
