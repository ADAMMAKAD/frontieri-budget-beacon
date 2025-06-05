import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, FileText, AlertTriangle } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

const activities = [
  {
    id: 1,
    type: "budget_approval",
    title: "Budget Approved",
    description: "Project Alpha Q2 budget approved by Finance",
    amount: 450000,
    time: "2 hours ago",
    icon: DollarSign,
    status: "approved"
  },
  {
    id: 2,
    type: "expense_submitted",
    title: "Expense Report Submitted",
    description: "Marketing campaign expenses for Project Beta",
    amount: 12500,
    time: "4 hours ago",
    icon: FileText,
    status: "pending"
  },
  {
    id: 3,
    type: "budget_alert",
    title: "Budget Alert",
    description: "Project Gamma approaching 90% budget utilization",
    amount: 315000,
    time: "6 hours ago",
    icon: AlertTriangle,
    status: "warning"
  },
  {
    id: 4,
    type: "budget_allocated",
    title: "Budget Allocated",
    description: "New resources allocated to Project Delta",
    amount: 75000,
    time: "1 day ago",
    icon: DollarSign,
    status: "allocated"
  },
  {
    id: 5,
    type: "report_generated",
    title: "Monthly Report Generated",
    description: "May 2024 financial summary report",
    amount: 0,
    time: "2 days ago",
    icon: FileText,
    status: "completed"
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "approved": return "bg-green-100 text-green-800";
    case "pending": return "bg-yellow-100 text-yellow-800";
    case "warning": return "bg-red-100 text-red-800";
    case "allocated": return "bg-blue-100 text-blue-800";
    case "completed": return "bg-gray-100 text-gray-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const getIconColor = (status: string) => {
  switch (status) {
    case "approved": return "text-green-600";
    case "pending": return "text-yellow-600";
    case "warning": return "text-red-600";
    case "allocated": return "text-blue-600";
    case "completed": return "text-gray-600";
    default: return "text-gray-600";
  }
};

export function RecentActivity() {
  const { formatCurrency } = useCurrency();

  return (
    <Card className="border-0 shadow-lg bg-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <span>Recent Activity</span>
        </CardTitle>
        <CardDescription>Latest budget activities and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted transition-colors duration-200">
              <div className={`p-2 rounded-full bg-muted ${getIconColor(activity.status)}`}>
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">{activity.title}</h4>
                  <Badge variant="outline" className={getStatusColor(activity.status)}>
                    {activity.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <div className="flex items-center justify-between">
                  {activity.amount > 0 && (
                    <span className="text-sm font-medium">{formatCurrency(activity.amount)}</span>
                  )}
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
