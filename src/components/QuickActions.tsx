"use client";

import { useRouter } from "next/navigation";
import {
  FiHome,
  FiCalendar,
  FiUsers,
  FiSettings,
  FiMap,
  FiStar
} from "react-icons/fi";
import { canAccessRoute } from "@/lib/roles";

interface QuickActionProps {
  title?: string;
  role?: string;
}

export function QuickActions({ title = "Quick Actions", role }: QuickActionProps) {
  const router = useRouter();

  const allActions = [
    {
      label: "Properties",
      icon: FiHome,
      path: "/admin/properties",
      color: "bg-primary/10 text-primary hover:bg-primary/20",
    },
    {
      label: "Reservations",
      icon: FiCalendar,
      path: "/admin/reservations",
      color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
    },
    {
      label: "Users",
      icon: FiUsers,
      path: "/admin/users",
      color: "bg-violet-50 text-violet-600 hover:bg-violet-100",
    },
    {
      label: "Agents",
      icon: FiStar,
      path: "/admin/agents",
      color: "bg-amber-50 text-amber-600 hover:bg-amber-100",
    },
    {
      label: "Photographers",
      icon: FiMap,
      path: "/admin/photographers",
      color: "bg-cyan-50 text-cyan-600 hover:bg-cyan-100",
    },
    {
      label: "Settings",
      icon: FiSettings,
      path: "/admin/settings",
      color: "bg-gray-100 text-gray-600 hover:bg-gray-200",
    },
  ];

  // Only surface shortcuts the current role can actually open.
  const actions = role
    ? allActions.filter((action) => canAccessRoute(role, action.path))
    : allActions;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm w-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => router.push(action.path)}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl transition-all cursor-pointer duration-300 ease-in-out ${action.color}`}
          >
            <action.icon className="w-6 h-6" />
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;
