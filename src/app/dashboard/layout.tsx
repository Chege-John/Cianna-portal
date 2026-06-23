"use client";

import React, { useState, useEffect } from "react";
import { useSchool } from "@/context/SchoolContext";
import { useRouter, usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { currentUser, authLoading, activeTab, setActiveTab } = useSchool();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Route protection & role-based routing redirection
  useEffect(() => {
    if (authLoading) return;

    // If not logged in, send to landing login page
    if (currentUser === null) {
      router.push("/");
      return;
    }

    const role = currentUser.role;
    const expectedPathPrefix = `/dashboard/${role}`;

    // If they land exactly on /dashboard, redirect to their role sub-dashboard
    if (pathname === "/dashboard") {
      router.push(expectedPathPrefix);
    } 
    // If their role has changed (via switcher), redirect them to their new dashboard root
    else if (pathname.startsWith("/dashboard/") && !pathname.startsWith(expectedPathPrefix)) {
      router.push(expectedPathPrefix);
    }
  }, [currentUser, authLoading, pathname, router]);

  // If currentUser is loading or not present, render a loading screen to prevent flash
  if (authLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fbfc] text-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#FF6B4A] animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f9fbfc] transition-colors duration-300">
      {/* Sidebar Navigation */}
      <DashboardSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
      />

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-64">
        <div className="p-4 lg:p-8 flex-1 flex flex-col">
          {/* Header Panel */}
          <DashboardHeader 
            activeTab={activeTab} 
            sidebarOpen={sidebarOpen} 
            setSidebarOpen={setSidebarOpen} 
          />

          {/* Subpage Contents */}
          <main className="flex-1 w-full animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
