"use client";

import React from "react";
import { useSchool } from "@/context/SchoolContext";
import dynamic from "next/dynamic";

const Progress = dynamic(() => import("@/components/dashboard/Progress"), { ssr: false });

export default function TeacherProgressPage() {
  const { currentUser } = useSchool();

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
    <div className="w-full max-w-full animate-fade-in">
      <Progress />
    </div>
  );
}
