import React from "react";
import { getMonthlyRevenue } from "@/server-actions/dashboard";
import DashboardChart from "./DashboardChart";

interface DashboardChartWrapperProps {
  role: string;
  userId: string;
  managedCounties?: string[];
}

export default async function DashboardChartWrapper({
  role,
  userId,
  managedCounties = [],
}: DashboardChartWrapperProps) {
  const chartData = await getMonthlyRevenue(role, userId, managedCounties);

  return <DashboardChart data={chartData} />;
}
