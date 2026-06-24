"use client";

import React from "react";
import { useSchool } from "@/context/SchoolContext";
import dynamic from "next/dynamic";

// Dynamic imports to optimize performance and prevent state collision
const Overview = dynamic(() => import("@/components/dashboard/Overview"), { ssr: false });
const Students = dynamic(() => import("@/components/dashboard/Students"), { ssr: false });
const Classes = dynamic(() => import("@/components/dashboard/Classes"), { ssr: false });
const Progress = dynamic(() => import("@/components/dashboard/Progress"), { ssr: false });

export default function TeacherPage() {
  const { currentUser, activeTab } = useSchool();

  if (!currentUser || currentUser.role !== "teacher") {
    return (
      <div className="p-6 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 max-w-2xl mx-auto mt-10">
        <h2 className="font-extrabold text-lg flex items-center gap-2">
          <span>Access Denied</span>
        </h2>
        <p className="text-sm mt-1">This dashboard is only accessible to authorized teachers and instructors.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full">
      {activeTab === "overview" && <Overview />}
      {activeTab === "students" && <Students />}
      {activeTab === "classes" && <Classes />}
      {activeTab === "progress" && <Progress />}
    </div>
  );
}
