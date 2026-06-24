"use client";

import React from "react";
import Image from "next/image";
import { useSchool, Role } from "@/context/SchoolContext";
import { 
  FaHome, 
  FaHistory, 
  FaCog, 
  FaSchool, 
  FaUserGraduate, 
  FaChalkboardTeacher, 
  FaFileInvoiceDollar, 
  FaCalendarCheck, 
  FaGraduationCap, 
  FaCalendarAlt,
  FaSignOutAlt,
  FaTimes,
  FaUsers,
  FaChartLine
} from "react-icons/fa";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const DashboardSidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen
}) => {
  const { currentUser, logout } = useSchool();

  if (!currentUser) return null;

  const role = currentUser.role;

  // Standard unified English navigation pages requested by the user
  const navItems: Record<Role, { id: string; name: string; icon: React.ReactNode }[]> = {
    "super-admin": [
      { id: "overview", name: "Dashboard", icon: <FaHome size={18} /> },
      { id: "accounts", name: "Accounts", icon: <FaUsers size={18} /> },
      { id: "payments", name: "Payments", icon: <FaFileInvoiceDollar size={18} /> },
      { id: "students", name: "Students", icon: <FaUserGraduate size={18} /> },
      { id: "classes", name: "Classes", icon: <FaSchool size={18} /> },
      { id: "progress", name: "Progress", icon: <FaChartLine size={18} /> }
    ],
    "admin": [
      { id: "overview", name: "Dashboard", icon: <FaHome size={18} /> },
      { id: "accounts", name: "Accounts", icon: <FaUsers size={18} /> },
      { id: "payments", name: "Payments", icon: <FaFileInvoiceDollar size={18} /> },
      { id: "students", name: "Students", icon: <FaUserGraduate size={18} /> },
      { id: "classes", name: "Classes", icon: <FaSchool size={18} /> },
      { id: "progress", name: "Progress", icon: <FaChartLine size={18} /> }
    ],
    "teacher": [
      { id: "overview", name: "Dashboard", icon: <FaHome size={18} /> },
      { id: "students", name: "Students", icon: <FaUserGraduate size={18} /> },
      { id: "classes", name: "Classes", icon: <FaSchool size={18} /> },
      { id: "progress", name: "Progress", icon: <FaChartLine size={18} /> }
    ],
    "student": [
      { id: "overview", name: "Dashboard", icon: <FaHome size={18} /> },
      { id: "classes", name: "Classes", icon: <FaSchool size={18} /> },
      { id: "progress", name: "Progress", icon: <FaChartLine size={18} /> },
      { id: "payments", name: "Payments", icon: <FaFileInvoiceDollar size={18} /> }
    ],
    "parent": [
      { id: "overview", name: "Dashboard", icon: <FaHome size={18} /> },
      { id: "progress", name: "Progress", icon: <FaChartLine size={18} /> },
      { id: "payments", name: "Payments", icon: <FaFileInvoiceDollar size={18} /> }
    ]
  };

  const items = navItems[role] || [];

  const NavContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Brand Logo Header */}
      <div className="py-8 px-6 flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <Image
          src="/cli.jpg"
          alt="Cianna Logo"
          width={110}
          height={110}
          className="shrink-0 object-contain"
          priority
        />
      </div>

      {/* Primary Navigation System */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-none">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (onLinkClick) onLinkClick();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all duration-300 group text-left cursor-pointer ${
                isActive
                  ? "bg-[#256ff1] text-white font-bold shadow-md shadow-[#256ff1]/20 scale-[1.01]"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850/50 font-medium"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`transition-colors duration-300 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}>
                  {item.icon}
                </span>
                <span className="text-[16px] font-semibold">{item.name}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer Controls */}
      <div className="mt-auto p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 shrink-0">
        <div className="space-y-1">
          {/* Quick Settings Shortcut */}
          <button
            onClick={() => {
              setActiveTab("settings");
              if (onLinkClick) onLinkClick();
            }}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg transition-all font-semibold text-sm cursor-pointer text-left ${
              activeTab === "settings"
                ? "bg-[#256ff1]/10 text-[#256ff1] dark:text-blue-400 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-850 hover:shadow-sm"
            }`}
          >
            <FaCog size={16} className={activeTab === "settings" ? "text-[#256ff1] dark:text-blue-400" : "text-slate-400"} />
            <span>Settings</span>
          </button>

          {/* Logout Trigger */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/15 rounded-lg transition-all cursor-pointer group text-left"
          >
            <FaSignOutAlt size={16} className="text-slate-400 group-hover:text-rose-500 transition-colors shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Sidebar - Fixed Left Column */}
      <aside className="hidden lg:flex w-64 fixed top-0 bottom-0 left-0 z-30 shadow-sm overflow-hidden border-r border-slate-200 dark:border-slate-800">
        <NavContent />
      </aside>

      {/* 2. Mobile Sidebar Overlay Drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[990] lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 3. Mobile Sidebar sliding drawer container */}
      <div
        className={`fixed inset-y-0 left-0 w-[280px] bg-white dark:bg-slate-900 z-[1000] lg:hidden transition-transform duration-300 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } shadow-2xl flex flex-col`}
      >
        {/* Mobile Close Icon Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all z-10 cursor-pointer"
          aria-label="Close menu"
        >
          <FaTimes className="w-5 h-5" />
        </button>

        <div className="h-full overflow-y-auto">
          <NavContent onLinkClick={() => setIsOpen(false)} />
        </div>
      </div>
    </>
  );
};
