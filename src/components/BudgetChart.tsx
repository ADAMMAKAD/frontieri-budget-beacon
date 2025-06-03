
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const monthlyData = [
  { month: "Jan", planned: 400000, actual: 380000 },
  { month: "Feb", planned: 450000, actual: 420000 },
  { month: "Mar", planned: 380000, actual: 410000 },
  { month: "Apr", planned: 500000, actual: 485000 },
  { month: "May", planned: 420000, actual: 445000 },
  { month: "Jun", planned: 380000, actual: 365000 },
];

const departmentData = [
  { name: "Engineering", value: 35, color: "#3B82F6" },
  { name: "Marketing", value: 25, color: "#8B5CF6" },
  { name: "Operations", value: 20, color: "#10B981" },
  { name: "Research", value: 15, color: "#F59E0B" },
  { name: "Other", value: 5, color: "#6B7280" },
];

export function BudgetChart() {
  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Budget Performance</CardTitle>
        <CardDescription>Planned vs Actual spending over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" tickFormatter={(value) => `R$${(value / 1000).toLocaleString('pt-BR')}k`} />
            <Tooltip
              formatter={(value: number) => [`R$${value.toLocaleString('pt-BR')}`, ""]}
              labelStyle={{ color: "#374151" }}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
              }}
            />
            <Bar dataKey="planned" fill="#e5e7eb" name="Planned" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" fill="#3b82f6" name="Actual" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Budget Distribution by Department</h4>
          <div className="flex items-center space-x-8">
            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={60}
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {departmentData.map((dept, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }}></div>
                    <span className="text-sm text-gray-600">{dept.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{dept.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
