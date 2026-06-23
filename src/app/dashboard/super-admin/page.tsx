"use client";

import React from "react";
import { useSchool } from "@/context/SchoolContext";

export default function SuperAdminPage() {
  const { currentUser, activeTab, auditLogs, resetDatabase } = useSchool();

  if (!currentUser || currentUser.role !== "super-admin") {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl border border-rose-100 dark:border-rose-900/30">
        <h2 className="font-bold text-lg">Kein Zugriff</h2>
        <p className="text-sm mt-1">Diese Seite ist nur für Super-Administratoren zugänglich.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* System Status Card */}
          <div className="glass-card">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">System-Status</span>
            <span className="text-2xl font-black text-emerald-500 mt-2 block">Online</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Alle Server-Instanzen laufen im Normalbereich.</p>
          </div>
          {/* Logs Count Card */}
          <div className="glass-card">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Gesamte Audit-Protokolle</span>
            <span className="text-2xl font-black text-brand-indigo-600 dark:text-brand-indigo-400 mt-2 block">{auditLogs.length}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Überwachte Aktionen in der aktuellen Sitzung.</p>
          </div>
          {/* DB Management Card */}
          <div className="glass-card">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Datenbank zurücksetzen</span>
            <button 
              onClick={() => {
                if (confirm("Möchten Sie die Datenbank wirklich zurücksetzen? Alle Sitzungsdaten gehen verloren.")) {
                  resetDatabase();
                }
              }}
              className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
            >
              Werkseinstellungen laden
            </button>
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="glass-panel p-6">
          <h2 className="text-lg font-bold mb-4">System-Audit-Protokolle</h2>
          
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase border-b border-slate-200 dark:border-slate-850">
                  <th className="p-4 w-1/4">Zeitstempel</th>
                  <th className="p-4 w-1/4">Benutzer</th>
                  <th className="p-4 w-1/6">Rolle</th>
                  <th className="p-4 w-1/3">Aktion</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-850">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="p-4 font-mono text-slate-500 dark:text-slate-450">
                      {new Date(log.timestamp).toLocaleString("de-DE")}
                    </td>
                    <td className="p-4 font-semibold">{log.actor}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] uppercase font-bold text-slate-650 dark:text-slate-350">
                        {log.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">{log.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="glass-card max-w-xl">
          <h2 className="text-lg font-bold mb-4">Globale Einstellungen</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Institutname</label>
              <input type="text" defaultValue="Cianna Deutsch-Institut" className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Standardwährung</label>
              <select className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none">
                <option>Euro (€)</option>
                <option>US-Dollar ($)</option>
              </select>
            </div>
            <button className="px-4 py-2 bg-brand-indigo-650 hover:bg-brand-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors">
              Änderungen speichern
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
