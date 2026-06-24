import React from "react";
import { getDashboardStats } from "@/server-actions/dashboard";
import { RoundedPieChart } from "./RoundedPieChart";
import { STAFF_MANAGER_ROLES } from "@/lib/roles";

interface UserDistributionWrapperProps {
  role: string;
  userId: string;
  managedCounties?: string[];
}

export default async function UserDistributionWrapper({
  role,
  userId,
  managedCounties = [],
}: UserDistributionWrapperProps) {
  if (!STAFF_MANAGER_ROLES.includes(role)) return null;

  const { userDistribution } = await getDashboardStats(role, userId, managedCounties);

  const pieChartData = userDistribution.map((item) => ({
    label: item.role
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase()),
    value: item._count.role,
  }));

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          User Distribution
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Breakdown of users by role
        </p>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <RoundedPieChart data={pieChartData} />
      </div>
    </div>
  );
}
