import React from "react";
import { getPaymentStatus } from "@/server-actions/dashboard";
import { RoundedPieChart } from "./RoundedPieChart";

interface ReservationsStatusWrapperProps {
  role: string;
  userId: string;
  managedCounties?: string[];
}

export default async function ReservationsStatusWrapper({
  role,
  userId,
  managedCounties = [],
}: ReservationsStatusWrapperProps) {
  const statusData = await getPaymentStatus(role, userId, managedCounties);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Payment Status Mix
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Breakdown of payments by status
        </p>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <RoundedPieChart data={statusData} />
      </div>
    </div>
  );
}
