"use client";

import {
  FiUsers,
  FiDollarSign,
  FiAward,
  FiBookOpen,
  FiSettings,
  FiShield
} from "react-icons/fi";

interface QuickActionProps {
  title?: string;
  role?: string;
  setActiveTab?: (tab: string) => void;
}

export function QuickActions({ title = "Quick Actions", role, setActiveTab }: QuickActionProps) {
  const allActions = [
    {
      label: "Student Roster",
      icon: FiUsers,
      id: "students",
      color: "bg-blue-50 text-[#256ff1] hover:bg-blue-100 dark:bg-blue-900/10 dark:text-blue-400",
    },
    {
      label: "Fee Collection",
      icon: FiDollarSign,
      id: "payments",
      color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400",
    },
    {
      label: "Academic Logs",
      icon: FiAward,
      id: "progress",
      color: "bg-violet-50 text-violet-600 hover:bg-violet-100 dark:bg-violet-900/10 dark:text-violet-400",
    },
    {
      label: "Classroom Setup",
      icon: FiBookOpen,
      id: "classes",
      color: "bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/10 dark:text-amber-400",
    },
    {
      label: "Account Access",
      icon: FiShield,
      id: "accounts",
      color: "bg-cyan-50 text-cyan-600 hover:bg-cyan-100 dark:bg-cyan-900/10 dark:text-cyan-400",
    },
    {
      label: "System Settings",
      icon: FiSettings,
      id: "settings",
      color: "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400",
    },
  ];

  // For this specific portal, we'll just show all relevant actions for admin roles
  const isAdmin = role === "super-admin" || role === "admin";
  const actions = isAdmin ? allActions : allActions.slice(0, 3);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm w-full">
      <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100 mb-4">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => setActiveTab?.(action.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all cursor-pointer duration-300 ease-in-out hover:-translate-y-1 ${action.color} text-center outline-none border-none`}
          >
            <action.icon className="w-6 h-6" />
            <span className="text-[14px] font-semibold tracking-tight">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;
