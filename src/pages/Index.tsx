
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { OverviewDashboard } from "@/components/OverviewDashboard";
import { useState } from "react";

const Index = () => {
  const [activeSection, setActiveSection] = useState("overview");

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewDashboard />;
      case "planning":
        return <div className="p-6"><h2 className="text-2xl font-bold">Budget Planning</h2><p className="text-gray-600 mt-2">Budget planning tools coming soon...</p></div>;
      case "allocation":
        return <div className="p-6"><h2 className="text-2xl font-bold">Budget Allocation</h2><p className="text-gray-600 mt-2">Allocation management coming soon...</p></div>;
      case "tracking":
        return <div className="p-6"><h2 className="text-2xl font-bold">Budget Tracking</h2><p className="text-gray-600 mt-2">Real-time tracking coming soon...</p></div>;
      case "reporting":
        return <div className="p-6"><h2 className="text-2xl font-bold">Reporting</h2><p className="text-gray-600 mt-2">Advanced reporting coming soon...</p></div>;
      case "audit":
        return <div className="p-6"><h2 className="text-2xl font-bold">Audit Compliance</h2><p className="text-gray-600 mt-2">Audit trail and compliance tools coming soon...</p></div>;
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
