
import { LayoutDashboard, PieChart, DollarSign, TrendingUp, FileText, Shield, Settings, Bell, Users, Building2, UserCog, GitBranch, CheckSquare, ShieldCheck, Target, Activity, Brain, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission, getRoleDisplayName, getRoleColor, type UserRole } from "@/utils/rolePermissions";
import { apiClient } from "@/lib/api";
import { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarFooter,
} from "@/components/ui/sidebar";

const menuItems = [
  { 
    id: "overview", 
    title: "Overview", 
    icon: LayoutDashboard
  },
  { 
    id: "planning", 
    title: "Budget Planning", 
    icon: PieChart
  },
  { 
    id: "allocation", 
    title: "Budget Allocation", 
    icon: DollarSign
  },
  { 
    id: "tracking", 
    title: "Budget Tracking", 
    icon: TrendingUp
  },
  { 
    id: "milestones", 
    title: "Project Milestones", 
    icon: Target
  },
  { 
    id: "reporting", 
    title: "Reporting", 
    icon: FileText
  },
  { 
    id: "audit", 
    title: "Audit Compliance", 
    icon: Shield
  },
];

const advancedItems = [
  { 
    id: "analytics", 
    title: "Advanced Analytics", 
    icon: TrendingUp
  },
  { 
    id: "realtime", 
    title: "Real-Time Monitor", 
    icon: Activity
  },
  { 
    id: "ai-optimizer", 
    title: "AI Resource Optimizer", 
    icon: Brain
  },
];

const managementItems = [
  { 
    id: "expenses", 
    title: "Expense Management", 
    icon: DollarSign
  },
  { 
    id: "business-units", 
    title: "Business Units", 
    icon: Building2
  },
  { 
    id: "project-teams", 
    title: "Project Teams", 
    icon: Users
  },
  { 
    id: "project-admin", 
    title: "Project Admin", 
    icon: ShieldCheck
  },
  { 
    id: "budget-versions", 
    title: "Budget Versions", 
    icon: GitBranch
  },
  { 
    id: "approvals", 
    title: "Approval Workflows", 
    icon: CheckSquare
  },
  { 
    id: "notifications", 
    title: "Notifications", 
    icon: Bell
  },
  { 
    id: "settings", 
    title: "Settings", 
    icon: Settings
  },
];

const adminItems = [
  { 
    id: "admin", 
    title: "Admin Dashboard", 
    icon: Settings
  },
  // { 
  //   id: "user-management", 
  //   title: "User Management", 
  //   icon: Users
  // },
  // { 
  //   id: "user-registration", 
  //   title: "User Registration", 
  //   icon: UserCog
  // },
];

interface AppSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export function AppSidebar({ activeSection, setActiveSection }: AppSidebarProps) {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isCollapsed = state === "collapsed";
  const [isProjectAdmin, setIsProjectAdmin] = useState(false);
  
  const userRole = (user?.role || 'user') as UserRole;
  
  // Check if user is a project admin for any project
  useEffect(() => {
    const checkProjectAdminStatus = async () => {
      if (!user?.id) return;
      
      try {
        const adminProjects = await apiClient.getUserAdminProjects();
        setIsProjectAdmin(adminProjects.length > 0);
      } catch (error) {
        console.error('Error checking project admin status:', error);
        setIsProjectAdmin(false);
      }
    };
    
    checkProjectAdminStatus();
  }, [user?.id]);
  
  const shouldShowMenuItem = (item: any) => {
    // Map menu item IDs to resource names
    const resourceMap: Record<string, string> = {
      'overview': 'dashboard',
      'planning': 'budget-planning',
      'allocation': 'budget-allocation',
      'tracking': 'budget-tracking',
      'milestones': 'milestones',
      'reporting': 'reporting',
      'audit': 'audit',
      'expenses': 'expenses',
      'business-units': 'business-units',
      'project-teams': 'project-teams',
      'project-admin': 'project-admin',
      'budget-versions': 'budget-versions',
      'approvals': 'approvals',
      'notifications': 'notifications',
      'analytics': 'analytics',
      'realtime': 'realtime',
      'ai-optimizer': 'ai-optimizer',
      'admin': 'admin',
      // 'user-management': 'user-management',
      // 'user-registration': 'user-registration',
    };
    
    const resource = resourceMap[item.id] || item.id;
    
    // Special case for project-admin: show if user has system permission OR is a project admin
    if (item.id === 'project-admin') {
      return hasPermission(userRole, resource, 'write') || isProjectAdmin;
    }
    
    return hasPermission(userRole, resource);
  };
  
  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleNavigation = (itemId: string) => {
    if (itemId === "admin") {
      navigate("/admin");
    } else if (itemId === "project-admin") {
      navigate("/project-admin");
    } else {
      navigate("/");
      setActiveSection(itemId);
    }
  };

  return (
    <Sidebar className={`border-r border-gray-200 bg-white/80 backdrop-blur-sm ${isCollapsed ? "w-14" : "w-64"}`}>
      <SidebarHeader className="border-b border-gray-200 p-4">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900">Frontieri</h1>
              <p className="text-xs text-gray-500">PBMS</p>
            </div>
          </div>
        )}
        <SidebarTrigger className="ml-auto" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-600 font-medium">
            {!isCollapsed && "Project Budget Management"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.filter(shouldShowMenuItem).map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.id)}
                    className={`w-full transition-all duration-200 ${
                      activeSection === item.id
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                      <item.icon className={`h-4 w-4 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
                      {!isCollapsed && <span className="font-medium">{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

        {managementItems.filter(shouldShowMenuItem).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-600 font-medium">
              {!isCollapsed && "Management"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {managementItems.filter(shouldShowMenuItem).map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.id)}
                      className={`w-full transition-all duration-200 ${
                        activeSection === item.id
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <item.icon className={`h-4 w-4 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
                      {!isCollapsed && <span className="font-medium">{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {advancedItems.filter(shouldShowMenuItem).length > 0 && (
           <SidebarGroup>
             <SidebarGroupLabel className="text-purple-600 font-medium">
               {!isCollapsed && "Advanced Analytics"}
             </SidebarGroupLabel>
             <SidebarGroupContent>
               <SidebarMenu>
                 {advancedItems.filter(shouldShowMenuItem).map((item) => (
                   <SidebarMenuItem key={item.id}>
                     <SidebarMenuButton
                       onClick={() => handleNavigation(item.id)}
                       className={`w-full transition-all duration-200 ${
                         activeSection === item.id
                           ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg"
                           : "hover:bg-purple-50 text-purple-700"
                       }`}
                     >
                       <item.icon className={`h-4 w-4 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
                       {!isCollapsed && <span className="font-medium">{item.title}</span>}
                     </SidebarMenuButton>
                   </SidebarMenuItem>
                 ))}
               </SidebarMenu>
             </SidebarGroupContent>
           </SidebarGroup>
         )}

        {adminItems.filter(shouldShowMenuItem).length > 0 && (
           <SidebarGroup>
             <SidebarGroupLabel className="text-red-600 font-medium">
               {!isCollapsed && "Administration"}
             </SidebarGroupLabel>
             <SidebarGroupContent>
               <SidebarMenu>
                 {adminItems.filter(shouldShowMenuItem).map((item) => (
                   <SidebarMenuItem key={item.id}>
                     <SidebarMenuButton
                       onClick={() => handleNavigation(item.id)}
                       className={`w-full transition-all duration-200 ${
                         activeSection === item.id
                           ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg"
                           : "hover:bg-red-50 text-red-700"
                       }`}
                     >
                       <item.icon className={`h-4 w-4 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
                       {!isCollapsed && <span className="font-medium">{item.title}</span>}
                     </SidebarMenuButton>
                   </SidebarMenuItem>
                 ))}
               </SidebarMenu>
             </SidebarGroupContent>
           </SidebarGroup>
         )}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className="text-gray-700 hover:bg-gray-100"
                  onClick={() => handleNavigation("profile")}
                >
                  <Settings className={`h-4 w-4 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
                  {!isCollapsed && <span>Profile</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-gray-200">
        <div className="p-4 space-y-2">
          {!isCollapsed && user && (
            <div className="mb-3">
              <div className="font-medium text-gray-900 text-sm truncate">
                {user.full_name || user.email}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleColor(userRole)}`}>
                  {getRoleDisplayName(userRole)}
                </span>
                {user.department && (
                  <span className="text-xs text-gray-500 truncate">
                    {user.department}
                  </span>
                )}
              </div>
            </div>
          )}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                className="text-red-600 hover:bg-red-50 w-full"
                onClick={handleLogout}
              >
                <LogOut className={`h-4 w-4 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
                {!isCollapsed && <span>Sign Out</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
