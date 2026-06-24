"use client";

import React, { useState, useEffect } from "react";
import { useSchool } from "@/context/SchoolContext";
import dynamic from "next/dynamic";
import { FaChild } from "react-icons/fa";

// Dynamic subcomponent imports to minimize initial render costs
const Overview = dynamic(() => import("@/components/dashboard/Overview"), { ssr: false });
const Progress = dynamic(() => import("@/components/dashboard/Progress"), { ssr: false });
const Payments = dynamic(() => import("@/components/dashboard/Payments"), { ssr: false });

export default function ParentPage() {
  const { currentUser, activeTab, students } = useSchool();

  // Find linked children based on guardian email
  const myChildren = students.filter(
    s => s.parentEmail && s.parentEmail.toLowerCase() === currentUser?.email.toLowerCase()
  );

  const [selectedChildId, setSelectedChildId] = useState("");

  // Initialize selected child profile
  useEffect(() => {
    if (myChildren.length > 0 && !selectedChildId) {
      setSelectedChildId(myChildren[0].id);
    }
  }, [myChildren, selectedChildId]);

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
      <div className="bg-[#256ff1] text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FaChild size={18} className="text-blue-200" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200">Legal Guardian Status</span>
          </div>
          <h2 className="text-xl font-black">Welcome back, {currentUser.name}!</h2>
          <p className="text-xs text-blue-100 leading-normal max-w-xl">
            Audit your children's language training progress reports, review official teacher-logged evaluations, check session attendance ratios, and securely settle outstanding school bills.
          </p>
        </div>
      </div>

      {/* Child Selector Panel Dropdown */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl gap-4 shadow-sm">
        <div>
          <h2 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm leading-tight">Select Linked Child</h2>
          <p className="text-xs text-slate-400 mt-1">Filter active academic performance records and pending school fees.</p>
        </div>
        <select 
          value={selectedChildId}
          onChange={(e) => setSelectedChildId(e.target.value)}
          className="px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-700 dark:text-slate-300 cursor-pointer focus:bg-white focus:ring-1 focus:ring-[#256ff1] transition-all min-w-[200px]"
        >
          {myChildren.map(child => (
            <option key={child.id} value={child.id}>{child.name}</option>
          ))}
          {myChildren.length === 0 && (
            <option value="">No linked student profiles found</option>
          )}
        </select>
      </div>

      {selectedChildId ? (
        <div className="w-full">
          {activeTab === "overview" && <Overview selectedChildId={selectedChildId} />}
          {activeTab === "progress" && <Progress selectedChildId={selectedChildId} />}
          {activeTab === "payments" && <Payments selectedChildId={selectedChildId} />}
        </div>
      ) : (
        <div className="p-6 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-500 text-center font-medium">
          Please choose a child profile from the dashboard header to inspect their academic progress metrics.
        </div>
      )}
    </div>
  );
}
