import React from "react";
import { getTopContributingStudents } from "@/server-actions/dashboard";
import { FiUser } from "react-icons/fi";

interface TopApartmentsWrapperProps {
  role: string;
  userId: string;
  managedCounties?: string[];
}

export default async function TopApartmentsWrapper({
  role,
  userId,
  managedCounties = [],
}: TopApartmentsWrapperProps) {
  void managedCounties;
  const students = await getTopContributingStudents(role, userId);

  const maxRevenue = Math.max(...students.map((s) => s.revenue), 1);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Top Contributing Students
        </h3>
        <p className="text-sm text-gray-500">
          Highest contributing students
        </p>
      </div>

      <div className="space-y-5">
        {students.map((student, index) => {
          const pct = (student.revenue / maxRevenue) * 100;
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 font-medium text-gray-800">
                  <FiUser className="text-gray-400 shrink-0" />
                  <span>{student.name}</span>
                </div>
                <span className="font-semibold text-gray-900">
                  KSh {student.revenue.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
