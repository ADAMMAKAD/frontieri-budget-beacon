import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { OverviewDashboard } from "@/components/OverviewDashboard";
import { BudgetPlanning } from "@/components/BudgetPlanning";
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
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useState } from "react";

const Index = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const { user, loading, error } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔍 Index useEffect - Auth status:', { user: !!user, loading, error });
    
    if (!loading && !user) {
      console.log('🚪 No user found, redirecting to auth');
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    console.log('🔍 Index useEffect - Role status:', { activeSection, isAdmin, roleLoading });
    
    if (!roleLoading && activeSection === "admin" && !isAdmin) {
      console.log('🚫 User is not admin, switching to overview');
      setActiveSection("overview");
    }
  }, [activeSection, isAdmin, roleLoading]);

  // Show loading while auth is initializing
  if (loading) {
    console.log('⏳ Auth loading...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading application...</p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
              <p className="text-red-700 text-sm font-medium">Error occurred:</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show error if there's an auth error
  if (error && !user) {
    console.log('❌ Auth error without user, showing error screen');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
            <h2 className="text-red-800 text-lg font-semibold mb-2">Authentication Error</h2>
            <p className="text-red-700 text-sm mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to auth if no user
  if (!user) {
    console.log('🚪 User not authenticated, should redirect to auth');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to authentication...</p>
        </div>
      </div>
    );
  }

  console.log('🎉 Rendering main app for user:', user.email);

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
        case "admin":
          return isAdmin ? <AdminDashboard /> : <OverviewDashboard />;
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
