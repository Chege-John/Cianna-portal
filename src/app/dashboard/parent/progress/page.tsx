"use client";

import React from "react";
import { useSchool } from "@/context/SchoolContext";
import dynamic from "next/dynamic";

const Progress = dynamic(() => import("@/components/dashboard/Progress"), { ssr: false });

export default function ParentProgressPage() {
  const { selectedChildId } = useSchool();

  return (
    <div className="w-full max-w-full animate-fade-in">
      <Progress selectedChildId={selectedChildId} />
    </div>
  );
}
