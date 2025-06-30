
import { useState, useEffect } from "react";
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
import BusinessUnitManagement from "@/components/BusinessUnitManagement";
import ProjectTeamManagement from "@/components/ProjectTeamManagement";
import BudgetVersioning from "@/components/BudgetVersioning";
import ApprovalWorkflows from "@/components/ApprovalWorkflows";
import NotificationCenter from "@/components/NotificationCenter";
import AdminDashboard from "@/components/AdminDashboard";
import ProjectMilestones from "@/components/ProjectMilestones";
import AdvancedAnalyticsDashboard from "@/components/AdvancedAnalyticsDashboard";
import RealTimeMonitor from "@/components/RealTimeMonitor";
import AIResourceOptimizer from "@/components/AIResourceOptimizer";
import { SettingsDialog } from "@/components/SettingsDialog";

// Remove the duplicate import line that was here

const Index = () => {
  const [activeSection, setActiveSection] = useState(() => {
    // Get the saved section from localStorage, default to "overview"
    return localStorage.getItem('activeSection') || "overview";
  });

  // Save activeSection to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('activeSection', activeSection);
  }, [activeSection]);

  const renderContent = () => {
    try {
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
        case "analytics":
          return <AdvancedAnalyticsDashboard />;
        case "realtime":
          return <RealTimeMonitor />;
        case "ai-optimizer":
          return <AIResourceOptimizer />;
        case "admin":
          return <AdminDashboard />;
        case "settings":
          return (
            <div className="p-6">
              <SettingsDialog />
            </div>
          );
        default:
          return <OverviewDashboard />;
      }
    } catch (error) {
      console.error('Error rendering content:', error);
      return (
        <div className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600">Please try refreshing the page or selecting a different section.</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar 
            activeSection={activeSection} 
            setActiveSection={setActiveSection}
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
