"use client";

import React from "react";
import { useSchool } from "@/context/SchoolContext";
import { usePaymentSettings, useBanks, useSchoolMutations } from "@/hooks/use-school-data";
import { PageHeader } from "@/components/PageHeader";
import CustomSelect from "@/components/ui/CustomSelect";
import { FaCog } from "react-icons/fa";

export default function Settings() {
  const { currentUser } = useSchool();
  const { data: settings, isLoading: settingsLoading } = usePaymentSettings();
  const { data: banks = [], isLoading: banksLoading } = useBanks();
  const { updatePaymentSettings } = useSchoolMutations();

  const [bankName, setBankName] = React.useState("");
  const [accountRef, setAccountRef] = React.useState("");

  React.useEffect(() => {
    if (settings) {
      setBankName(settings.bankName);
      setAccountRef(settings.accountReference);
    }
  }, [settings]);

  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === "super-admin";

  const handleSavePaymentSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updatePaymentSettings.mutate({
      bankName,
      accountReference: accountRef,
    }, {
      onSuccess: () => alert("Payment settings updated successfully!")
    });
  };

  return (
    <div className="space-y-6 animate-fade-in w-full pb-20">
      <PageHeader 
        title="System Settings" 
        description="Configure institution parameters, payment gateways, and review system status."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-[#256ff1]">
            <FaCog size={18} />
            <h2 className="text-base font-extrabold text-slate-950 dark:text-slate-100">General Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Institute Name</label>
              <input 
                type="text" 
                defaultValue="Cianna German School" 
                disabled
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-800 rounded-xl outline-none font-semibold text-slate-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-850 opacity-80" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Default Currency</label>
              <CustomSelect
                disabled
                options={[
                  { value: "KES", label: "Kenya Shilling (KSh)" },
                  { value: "EUR", label: "Euro (€)" }
                ]}
                value="KES"
                onChange={() => {}}
                buttonClassName="!border-2 !border-gray-200 dark:!border-slate-800 !rounded-xl opacity-80"
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

        {/* Payment Gateway Settings (Super Admin Only) */}
        {isSuperAdmin && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-[#256ff1]">
              <FaCog size={18} />
              <h2 className="text-base font-extrabold text-slate-950 dark:text-slate-100">Payment Gateway (Serix)</h2>
            </div>

            <form onSubmit={handleSavePaymentSettings} className="space-y-4">
              <div className="relative z-[100]">
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Default Bank</label>
                <CustomSelect
                  options={Array.isArray(banks) ? banks.map((b: string) => ({ value: b, label: b })) : []}
                  value={bankName}
                  onChange={setBankName}
                  placeholder={banksLoading ? "Loading banks..." : "Select Bank..."}
                  buttonClassName="border-2 border-gray-200 dark:border-slate-800 rounded-xl"
                  size="lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Account Reference</label>
                <input 
                  type="text" 
                  value={accountRef}
                  onChange={(e) => setAccountRef(e.target.value)}
                  placeholder="e.g. 1301620998"
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-800 rounded-xl outline-none text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950"
                  style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                />
              </div>

              <button 
                type="submit"
                disabled={updatePaymentSettings.isPending}
                className="w-full bg-[#256ff1] hover:bg-blue-600 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
              >
                {updatePaymentSettings.isPending ? "Updating..." : "Save Gateway Settings"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
