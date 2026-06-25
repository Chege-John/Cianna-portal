"use client";

import React from "react";
import { useSchool } from "@/context/SchoolContext";
import { PageHeader } from "@/components/PageHeader";
import CustomSelect from "@/components/ui/CustomSelect";
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
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Institute Name</label>
            <input 
              type="text" 
              defaultValue="Cianna German School" 
              disabled
              className="w-full px-4 py-3 backdrop-blur-md border-2 border-gray-200 dark:border-slate-800 rounded-xl outline-none font-semibold text-slate-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-850 opacity-80" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Default Currency</label>
            <CustomSelect
              disabled
              options={[
                { value: "EUR", label: "Euro (€)" },
                { value: "USD", label: "US Dollar ($)" }
              ]}
              value="EUR"
              onChange={() => {}}
              buttonClassName="!border-2 !border-gray-200 dark:!border-slate-800 !rounded-xl hover:!border-[#256ff1]/60 transition-all !text-slate-800 dark:!text-slate-200 font-semibold"
              style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
              size="lg"
            />
          </div>
          
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-extrabold text-[#256ff1] uppercase tracking-wider block">Database Status</span>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Live PostgreSQL database connected via Drizzle ORM.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
