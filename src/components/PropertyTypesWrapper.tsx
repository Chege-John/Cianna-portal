import React from "react";
import { getClassroomDistribution } from "@/server-actions/dashboard";
import { RoundedPieChart } from "./RoundedPieChart";

interface PropertyTypesWrapperProps {
  role: string;
  userId: string;
  managedCounties?: string[];
}

export default async function PropertyTypesWrapper({
  role,
  userId,
  managedCounties = [],
}: PropertyTypesWrapperProps) {
  void managedCounties;
  const classroomData = await getClassroomDistribution(role, userId);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Classroom Mix
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Distribution by classroom
        </p>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <RoundedPieChart data={classroomData} />
      </div>
    </div>
  );
}
