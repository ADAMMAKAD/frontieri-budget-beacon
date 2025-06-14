
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { OverviewDashboard } from "@/components/OverviewDashboard";
import { BudgetPlanning } from "@/components/BudgetPlanning";
import { BudgetAllocation } from "@/components/BudgetAllocation";
import { BudgetTracking } from "@/components/BudgetTracking";
import { Reporting } from "@/components/Reporting";
import { AuditCompliance } from "@/components/AuditCompliance";
import { ProfileManagement } from "@/components/ProfileManagement";
import { ExpenseManagement } from "@/components/ExpenseManagement";
import { BusinessUnitManagement } from "@/components/BusinessUnitManagement";
import ProjectTeamManagement from "@/components/ProjectTeamManagement";
import { BudgetVersioning } from "@/components/BudgetVersioning";
import { ApprovalWorkflows } from "@/components/ApprovalWorkflows";
import { NotificationCenter } from "@/components/NotificationCenter";
import { AdminDashboard } from "@/components/AdminDashboard";
import { ProjectMilestones } from "@/components/ProjectMilestones";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useState } from "react";

const Index = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Redirect non-admin users away from admin section
  useEffect(() => {
    if (!roleLoading && activeSection === "admin" && !isAdmin) {
      setActiveSection("overview");
    }
  }, [activeSection, isAdmin, roleLoading]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewDashboard />;
      case "planning":
        return <BudgetPlanning />;
      case "allocation":
        return <BudgetAllocation />;
      case "tracking":
        return <BudgetTracking />;
      case "milestones":
        return <ProjectMilestones />;
      case "reporting":
        return <Reporting />;
      case "audit":
        return <AuditCompliance />;
      case "profile":
        return <ProfileManagement />;
      case "expenses":
        return <ExpenseManagement />;
      case "business-units":
        return <BusinessUnitManagement />;
      case "project-teams":
        return <ProjectTeamManagement />;
      case "budget-versions":
        return <BudgetVersioning />;
      case "approvals":
        return <ApprovalWorkflows />;
      case "notifications":
        return <NotificationCenter />;
      case "admin":
        // Only render admin dashboard if user is admin
        return isAdmin ? <AdminDashboard /> : <OverviewDashboard />;
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar 
            activeSection={activeSection} 
            setActiveSection={setActiveSection}
            isAdmin={isAdmin}
          />
          <div className="flex-1 flex flex-col">
            <DashboardHeader />
            <main className="flex-1 overflow-auto">
              {renderContent()}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Index;
