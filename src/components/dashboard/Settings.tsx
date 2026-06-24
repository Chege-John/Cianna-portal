"use client";

import React from "react";
import { useSchool } from "@/context/SchoolContext";
import { PageHeader } from "@/components/PageHeader";
import { FaCog } from "react-icons/fa";

export default function Settings() {
  const { currentUser } = useSchool();

  if (!currentUser) return null;

  return (
    <div className="space-y-6 animate-fade-in w-full">
      <PageHeader 
        title="System Settings" 
        description="Configure default currency, institution parameters, and review system storage settings."
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm max-w-xl">
        <div className="flex items-center gap-2 mb-4 text-[#256ff1]">
          <FaCog size={18} />
          <h2 className="text-base font-extrabold text-slate-950 dark:text-slate-100">Settings Panel</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-1">Institute Name</label>
            <input 
              type="text" 
              defaultValue="Cianna German School" 
              disabled
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl outline-none font-semibold text-slate-500 dark:text-slate-400" 
            />
          </div>
          
          <div>
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-1">Default Currency</label>
            <select 
              disabled
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl outline-none font-bold text-slate-500 dark:text-slate-400 cursor-pointer"
            >
              <option>Euro (€)</option>
              <option>US Dollar ($)</option>
            </select>
          </div>
          
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 block">Database Status</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Mock database stored locally on your web browser cache storage (localStorage).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
