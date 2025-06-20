
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import AdminDashboard from "@/components/AdminDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";

const AdminPage = () => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, roleLoading, navigate]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar 
            activeSection="admin" 
            setActiveSection={() => {}}
            isAdmin={isAdmin}
          />
          <div className="flex-1 flex flex-col">
            <DashboardHeader />
            <main className="flex-1 overflow-auto">
              <AdminDashboard />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AdminPage;
