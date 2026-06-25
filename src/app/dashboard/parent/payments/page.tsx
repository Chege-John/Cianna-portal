"use client";

import React from "react";
import { useSchool } from "@/context/SchoolContext";
import dynamic from "next/dynamic";

const Payments = dynamic(() => import("@/components/dashboard/Payments"), { ssr: false });

export default function ParentPaymentsPage() {
  const { selectedChildId } = useSchool();

  return (
    <div className="w-full max-w-full animate-fade-in">
      <Payments selectedChildId={selectedChildId} />
    </div>
  );
}
