"use client";

import React, { useEffect } from "react";
import { useSchool } from "@/context/SchoolContext";
import { FaChild } from "react-icons/fa";
import { useStudents } from "@/hooks/use-school-data";

export default function ParentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, selectedChildId, setSelectedChildId } = useSchool();

  // Fetch student profiles to find linked children using our custom hook
  const { data: students = [], isLoading: studentsLoading } = useStudents();

  // Find linked children based on guardian email
  const myChildren = students.filter(
    (s) =>
      s.parentEmail &&
      s.parentEmail.toLowerCase() === currentUser?.email.toLowerCase()
  );

  // Initialize selected child profile
  useEffect(() => {
    if (myChildren.length > 0 && !selectedChildId) {
      setSelectedChildId(myChildren[0].id);
    }
  }, [myChildren, selectedChildId, setSelectedChildId]);

  if (!currentUser || currentUser.role !== "parent") {
    return (
      <div className="p-6 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 max-w-2xl mx-auto mt-10">
        <h2 className="font-extrabold text-lg flex items-center gap-2">
          <span>Access Denied</span>
        </h2>
        <p className="text-sm mt-1">This dashboard is only accessible to authorized parent and guardian profiles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Guardian Welcome Header Banner */}
      <div className="bg-[#256ff1] text-white rounded-2xl p-6 shadow-md flex items-center justify-between animate-fade-in">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FaChild size={18} className="text-blue-200" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200">Legal Guardian Status</span>
          </div>
          <h2 className="text-xl font-black">Welcome back, {currentUser.name}!</h2>
          <p className="text-xs text-blue-100 leading-normal max-w-xl">
            Audit your children&apos;s language training progress reports, review official teacher-logged evaluations, check session attendance ratios, and securely settle outstanding school bills.
          </p>
        </div>
      </div>

      {/* Child Selector Panel Dropdown */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl gap-4 shadow-sm animate-fade-in">
        <div>
          <h2 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm leading-tight">Select Linked Child</h2>
          <p className="text-xs text-slate-400 mt-1">Filter active academic performance records and pending school fees.</p>
        </div>
        {studentsLoading ? (
          <div className="w-[200px] h-10 bg-slate-100 animate-pulse rounded-xl" />
        ) : (
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-700 dark:text-slate-300 cursor-pointer focus:bg-white focus:ring-1 focus:ring-[#256ff1] transition-all min-w-[200px]"
          >
            {myChildren.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
            {myChildren.length === 0 && (
              <option value="">No linked student profiles found</option>
            )}
          </select>
        )}
      </div>

      {selectedChildId ? (
        <div className="w-full">{children}</div>
      ) : (
        <div className="p-6 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-500 text-center font-medium">
          Please choose a child profile from the selector above to inspect their academic progress metrics.
        </div>
      )}
    </div>
  );
}
