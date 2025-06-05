
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { OverviewDashboard } from "@/components/OverviewDashboard";
import BudgetPlanning from "@/components/BudgetPlanning";
import BudgetAllocation from "@/components/BudgetAllocation";
import BudgetTracking from "@/components/BudgetTracking";
import Reporting from "@/components/Reporting";
import AuditCompliance from "@/components/AuditCompliance";
import ProfileManagement from "@/components/ProfileManagement";
import ExpenseManagement from "@/components/ExpenseManagement";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

const Index = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
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
      case "reporting":
        return <Reporting />;
      case "audit":
        return <AuditCompliance />;
      case "profile":
        return <ProfileManagement />;
      case "expenses":
        return <ExpenseManagement />;
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
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
