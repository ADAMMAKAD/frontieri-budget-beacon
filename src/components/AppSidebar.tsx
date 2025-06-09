
import { LayoutDashboard, PieChart, DollarSign, TrendingUp, FileText, Shield, Settings, Bell, Users, Building2, UserCog, GitBranch, CheckSquare, ShieldCheck, Target } from "lucide-react";
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
} from "@/components/ui/sidebar";

const menuItems = [
  { id: "overview", title: "Overview", icon: LayoutDashboard },
  { id: "planning", title: "Budget Planning", icon: PieChart },
  { id: "allocation", title: "Budget Allocation", icon: DollarSign },
  { id: "tracking", title: "Budget Tracking", icon: TrendingUp },
  { id: "milestones", title: "Project Milestones", icon: Target },
  { id: "reporting", title: "Reporting", icon: FileText },
  { id: "audit", title: "Audit Compliance", icon: Shield },
];

const managementItems = [
  { id: "expenses", title: "Expense Management", icon: DollarSign },
  { id: "business-units", title: "Business Units", icon: Building2 },
  { id: "project-teams", title: "Project Teams", icon: Users },
  { id: "budget-versions", title: "Budget Versions", icon: GitBranch },
  { id: "approvals", title: "Approval Workflows", icon: CheckSquare },
  { id: "notifications", title: "Notifications", icon: Bell },
];

const adminItems = [
  { id: "admin", title: "Admin Dashboard", icon: ShieldCheck },
];

interface AppSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  isAdmin?: boolean;
}

export function AppSidebar({ activeSection, setActiveSection, isAdmin }: AppSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={`border-r border-gray-200 bg-white/80 backdrop-blur-sm ${isCollapsed ? "w-14" : "w-64"}`}>
      <SidebarHeader className="border-b border-gray-200 p-4">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
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
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full transition-all duration-200 ${
                      activeSection === item.id
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
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

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-600 font-medium">
            {!isCollapsed && "Management"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full transition-all duration-200 ${
                      activeSection === item.id
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
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

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-red-600 font-medium">
              {!isCollapsed && "Administration"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => setActiveSection(item.id)}
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
                  onClick={() => setActiveSection("profile")}
                >
                  <Settings className={`h-4 w-4 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
                  {!isCollapsed && <span>Profile</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
