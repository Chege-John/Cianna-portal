"use client";

import React from "react";
import { useSchool } from "@/context/SchoolContext";
import dynamic from "next/dynamic";

const Accounts = dynamic(() => import("@/components/dashboard/Accounts"), { ssr: false });

export default function AdminAccountsPage() {
  const { currentUser } = useSchool();

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="p-6 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 max-w-2xl mx-auto mt-10">
        <h2 className="font-extrabold text-lg flex items-center gap-2">
          <span>Access Denied</span>
        </h2>
        <p className="text-sm mt-1">This dashboard is only accessible to administrative team members.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full animate-fade-in">
      <Accounts />
    </div>
  );
}
