import React from "react";
import { getWeeklyReservations } from "@/server-actions/dashboard";
import WeeklyReservationsChartSyncfusion from "./WeeklyReservationsChartSyncfusion";

interface WeeklyReservationsWrapperProps {
  role: string;
  userId: string;
  managedCounties?: string[];
}

export default async function WeeklyReservationsWrapper({
  role,
  userId,
  managedCounties = [],
}: WeeklyReservationsWrapperProps) {
  const { data, total } = await getWeeklyReservations(role, userId, managedCounties);

  return <WeeklyReservationsChartSyncfusion data={data} total={total} />;
}
