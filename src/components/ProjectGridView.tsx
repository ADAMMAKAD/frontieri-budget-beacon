
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Project {
  id: string;
  name: string;
  total_budget: number;
  spent_budget: number;
  status: string;
}

interface ProjectGridViewProps {
  projects: Project[];
}

export const ProjectGridView = ({ projects }: ProjectGridViewProps) => {
  const { formatCurrency } = useCurrency();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-green-600";
      case "completed": return "text-blue-600";
      case "on-hold": return "text-yellow-600";
      case "cancelled": return "text-red-600";
      default: return "text-gray-600";
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "completed": return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "on-hold": return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "cancelled": return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => {
        const budget = project.total_budget || 0;
        const spent = project.spent_budget || 0;
        const utilization = budget > 0 ? (spent / budget) * 100 : 0;

        return (
          <div key={project.id} className="p-4 rounded-lg bg-muted hover:bg-muted/80 transition-all duration-200 border border-border hover:shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-sm truncate">{project.name}</h4>
                {getStatusIcon(project.status)}
              </div>
              <Badge variant="outline" className={`${getStatusColor(project.status)} text-xs`}>
                {project.status.replace("-", " ").toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Budget: {formatCurrency(budget)}</span>
                <span>Spent: {formatCurrency(spent)}</span>
              </div>
              <Progress value={utilization} className="h-1.5" />
              <p className="text-xs text-muted-foreground text-center">{utilization.toFixed(1)}% utilized</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
