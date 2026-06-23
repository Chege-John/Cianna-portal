"use client";

import { useEffect } from "react";
import { useSchool } from "@/context/SchoolContext";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { currentUser, authLoading } = useSchool();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (currentUser) {
        router.push(`/dashboard/${currentUser.role}`);
      } else {
        router.push("/");
      }
    }
  }, [currentUser, authLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9fbfc] text-slate-800">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#FF6B4A] animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Weiterleitung...</p>
      </div>
    </div>
  );
}
