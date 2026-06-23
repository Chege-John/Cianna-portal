"use client";

import React from "react";
import { Invoice } from "@/context/SchoolContext";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  studentName?: string;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  studentName = "Schüler/in"
}) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[2000] p-4 bg-slate-900/60 backdrop-blur-sm animate-fade">
      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 animate-scale overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          title="Schließen"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Invoice Body (Print Area) */}
        <div id="printable-invoice" className="text-slate-800 dark:text-slate-100">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl">🇩🇪</span>
                <div>
                  <h2 className="font-extrabold text-xl leading-tight">Cianna Portal</h2>
                  <span className="text-xs text-brand-green-500 font-bold uppercase tracking-wider">Deutsch-Institut</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Goethestraße 12, 80336 München<br />
                info@cianna.de | www.cianna.de
              </p>
            </div>
            <div className="mt-4 md:mt-0 text-left md:text-right">
              <h3 className="text-2xl font-black uppercase text-slate-400 dark:text-slate-600 tracking-wide">RECHNUNG</h3>
              <p className="text-sm font-semibold mt-1">Rechnungsnummer: <span className="font-mono">{invoice.id}</span></p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Erstellt am: {invoice.createdAt}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Rechnungsempfänger</h4>
              <p className="text-base font-bold">{studentName}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Schüler/in des Cianna-Instituts</p>
            </div>
            <div className="md:text-right">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Zahlungsinformationen</h4>
              <p className="text-sm">Fälligkeitsdatum: <span className="font-semibold">{invoice.dueDate}</span></p>
              <div className="mt-2 md:float-right">
                {invoice.status === "Paid" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Bezahlt
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    Offen
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-6">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 font-bold text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider w-3/4">Beschreibung</th>
                  <th className="py-3 font-bold text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Betrag</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 dark:border-slate-800/50">
                  <td className="py-4">
                    <p className="font-semibold">{invoice.description}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sprachkursgebühr & Kursunterlagen</p>
                  </td>
                  <td className="py-4 text-right font-mono font-semibold">{invoice.amount.toFixed(2)} €</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Grand Total */}
          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="w-full md:w-1/2 flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
                <span>Zwischensumme:</span>
                <span className="font-mono">{invoice.amount.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
                <span>MwSt. (Umsatzsteuerbefreit):</span>
                <span className="font-mono">0.00 €</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold border-t border-slate-200 dark:border-slate-800 pt-2">
                <span>Gesamtsumme:</span>
                <span className="font-mono text-brand-indigo-600 dark:text-brand-indigo-400">{invoice.amount.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-6 no-print">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer transition-colors"
          >
            Abbrechen
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-slate-750 dark:hover:bg-slate-300 font-semibold cursor-pointer transition-all duration-200"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Drucken
          </button>
        </div>
      </div>
    </div>
  );
};
