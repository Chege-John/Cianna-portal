"use client";

import React, { useEffect, useState } from "react";
import { useSchool, Role } from "@/context/SchoolContext";

interface HeaderProps {
  activeTab: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const DashboardHeader: React.FC<HeaderProps> = ({
  activeTab,
  sidebarOpen,
  setSidebarOpen
}) => {
  const { currentUser, switchRole } = useSchool();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Load and apply theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("cianna_theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("cianna_theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  if (!currentUser) return null;

  // Format tab names nicely
  const getTabTitle = () => {
    switch (activeTab) {
      case "overview":
        return "Overview";
      case "audit":
        return "System Audit Logs";
      case "settings":
        return "System Settings";
      case "classrooms":
        return "Classes & Courses";
      case "students":
        return "Student Management";
      case "teachers":
        return "Teacher Management";
      case "billing":
        return currentUser.role === "admin" ? "Fees & Billing" : "Invoices & Payments";
      case "attendance":
        return "Record Attendance";
      case "grades":
        return currentUser.role === "teacher" ? "Gradebook Entry" : "Grades Overview";
      case "timetable":
        return "Timetable";
      default:
        return "Dashboard";
    }
  };

  const getRoleLabel = (r: Role) => {
    switch (r) {
      case "super-admin": return "Super Admin";
      case "admin": return "Administrator";
      case "teacher": return "Teacher";
      case "student": return "Student";
      case "parent": return "Parent";
    }
  };

  return (
    <header className="h-[70px] flex items-center justify-between px-4 lg:px-8 mb-8 rounded-xl glass-panel">
      <div className="flex items-center gap-4">
        <button 
          className="block lg:hidden text-slate-800 dark:text-slate-100 hover:opacity-80 transition-opacity cursor-pointer"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Open menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <h1 className="text-xl lg:text-2xl font-extrabold text-slate-800 dark:text-slate-100">{getTabTitle()}</h1>
      </div>

      <div className="flex items-center gap-6">
        {/* Dynamic Role Switcher for Demonstration/Review */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <label htmlFor="role-select" className="text-xs font-semibold text-slate-500 dark:text-slate-400">Test Role:</label>
          <select 
            id="role-select"
            value={currentUser.role}
            onChange={(e) => switchRole(e.target.value as Role)}
            className="bg-transparent border-none font-bold text-brand-indigo-600 dark:text-brand-indigo-400 cursor-pointer text-sm outline-none"
          >
            <option value="super-admin">Super Admin</option>
            <option value="admin">Administrator</option>
            <option value="teacher">Teacher (Herr Weber)</option>
            <option value="student">Student (Lukas Meier)</option>
            <option value="parent">Parent (Maria Meier)</option>
          </select>
        </div>

        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme} 
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:border-slate-350 dark:hover:border-slate-500 transition-all cursor-pointer"
          title={theme === "light" ? "Dark Mode" : "Light Mode"}
        >
          {theme === "light" ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          )}
        </button>

        {/* User Info Block */}
        <div className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-slate-800">
          <div className="w-[38px] h-[38px] rounded-full bg-brand-indigo-50 dark:bg-brand-indigo-500/15 text-brand-indigo-600 dark:text-brand-indigo-400 font-bold flex items-center justify-center text-lg border-2 border-slate-200 dark:border-slate-800">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">{currentUser.name}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{getRoleLabel(currentUser.role)}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
