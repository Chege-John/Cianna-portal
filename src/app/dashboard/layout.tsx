"use client";

import React, { useState, useEffect } from "react";
import { useSchool } from "@/context/SchoolContext";
import { useRouter, usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import FirstLoginModal from "@/app/FirstLoginModal";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { currentUser, authLoading, activeTab, setActiveTab } = useSchool();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const [showFirstLogin, setShowFirstLogin] = useState(false);

  useEffect(() => {
    if (currentUser?.mustChangePassword) {
      setShowFirstLogin(true);
    }
  }, [currentUser]);

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
          <p className="text-sm font-semibold text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f9fbfc] dark:bg-slate-950 text-slate-900 transition-colors duration-300 w-full overflow-x-hidden">
      {/* Sidebar Navigation */}
      <DashboardSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
      />

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-64 w-full overflow-x-hidden">
        {/* Sticky Header */}
        <DashboardHeader 
          activeTab={activeTab} 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
        />

        {/* Dynamic Page Content with full stretch edge-to-edge layout */}
        <div className="px-4 pt-4 pb-6 md:px-8 md:pt-6 md:pb-8 flex-1 w-full">
          <main className="w-full animate-fade-in">
            {children}
          </main>
        </div>
      </div>

      <FirstLoginModal 
        isOpen={showFirstLogin} 
        firstLoginData={{ isFirstLogin: true, requiresPasswordChange: true, requiresPinChange: false }}
        onComplete={() => {
          setShowFirstLogin(false);
          window.location.reload(); // Refresh to get updated user state without mustChangePassword
        }}
      />
    </div>
  );
}
