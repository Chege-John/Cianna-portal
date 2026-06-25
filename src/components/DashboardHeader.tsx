"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSchool, Role } from "@/context/SchoolContext";
import { 
  FaSearch, 
  FaBell, 
  FaCog, 
  FaSignOutAlt, 
  FaChevronDown
} from "react-icons/fa";

interface HeaderProps {
  activeTab: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const DashboardHeader: React.FC<HeaderProps> = ({
  activeTab: _activeTab,
  sidebarOpen: _sidebarOpen,
  setSidebarOpen: _setSidebarOpen
}) => {
  const { currentUser, logout, setActiveTab } = useSchool();
  void _activeTab;
  void _sidebarOpen;
  void _setSidebarOpen;
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Force Light Theme unconditionally as requested
  useEffect(() => {
    localStorage.setItem("cianna_theme", "light");
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.classList.remove("dark");
  }, []);

  // Close user profile dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentUser) return null;

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
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 backdrop-blur-md shadow-sm transition-colors duration-200">
     
      {/* 2. Middle side - English Search Bar (Hidden on Mobile) */}
      <div className="flex-1 max-w-sm lg:max-w-md mx-4 hidden md:block">
        <div className="relative group">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#256ff1] transition-colors" size={14} />
          <input
            type="text"
            placeholder="Search courses, documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-xl pl-10 pr-4 py-2 text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#256ff1] dark:focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      {/* 3. Right side - Control Panel actions */}
      <div className="flex items-center gap-2 md:gap-4 ml-auto shrink-0">

        {/* Pulsing Bell Notification Button */}
        <button className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl relative border border-transparent hover:border-slate-100 dark:hover:border-slate-700/50 transition-all cursor-pointer group">
          <FaBell size={16} className="group-hover:text-[#256ff1] dark:group-hover:text-blue-400 transition-colors" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#256ff1] dark:bg-blue-400 rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-pulse"></span>
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

        {/* User Profile dropdown panel */}
        <div className="relative" ref={userMenuRef}>
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer rounded-xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700/50"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-[#256ff1]/20 overflow-hidden shrink-0 flex items-center justify-center font-bold text-sm text-[#256ff1] dark:text-blue-400">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden sm:flex flex-col items-start leading-none text-left mr-0.5">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[100px]">
                {currentUser.name}
              </span>
              <span className="text-[10px] font-bold text-[#256ff1] dark:text-blue-400 mt-1 tracking-wide uppercase">
                {getRoleLabel(currentUser.role)}
              </span>
            </div>
            <FaChevronDown size={10} className={`text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Real dropdown popup box */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 mb-1 rounded-t-2xl">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                  {currentUser.email}
                </p>
              </div>
              
              <div className="px-2 pb-2 pt-1 space-y-0.5">
                <button
                  onClick={() => {
                    setActiveTab("settings");
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[#256ff1] dark:hover:text-blue-400 hover:bg-[#256ff1]/5 dark:hover:bg-blue-500/10 rounded-xl transition-all group cursor-pointer text-left"
                >
                  <FaCog size={14} className="text-slate-400 group-hover:text-[#256ff1] dark:group-hover:text-blue-400 transition-colors" />
                  <span>Settings</span>
                </button>
                
                <button 
                  onClick={() => {
                    logout();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all group cursor-pointer text-left"
                >
                  <FaSignOutAlt size={14} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};
