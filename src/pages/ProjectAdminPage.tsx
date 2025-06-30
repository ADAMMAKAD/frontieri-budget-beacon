import React from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import ProjectAdminDashboard from '@/components/ProjectAdminDashboard';

export default function ProjectAdminPage() {
    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
                <AppSidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <DashboardHeader />
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                        <ProjectAdminDashboard />
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}