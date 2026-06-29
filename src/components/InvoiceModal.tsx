"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Invoice } from "@/context/SchoolContext";
import { usePayments } from "@/hooks/use-school-data";

const getPaymentMethodDetails = (method: string) => {
  const normalized = method.toUpperCase();
  if (normalized.includes("STK") || normalized.includes("MPESA") || normalized.includes("M-PESA") || normalized.includes("MOBILE")) {
    return {
      label: "M-PESA",
      icon: (
        <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
        </svg>
      ),
      bg: "bg-emerald-50 dark:bg-emerald-950/20"
    };
  }
  if (normalized.includes("CARD") || normalized.includes("CREDIT") || normalized.includes("VISA") || normalized.includes("MASTERCARD")) {
    return {
      label: "Card",
      icon: (
        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      ),
      bg: "bg-blue-50 dark:bg-blue-950/20"
    };
  }
  if (normalized.includes("BANK") || normalized.includes("TRANSFER") || normalized.includes("EFT")) {
    return {
      label: "Bank Transfer",
      icon: (
        <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.5H4.5V21m-2.25 0h19.5" />
        </svg>
      ),
      bg: "bg-indigo-50 dark:bg-indigo-950/20"
    };
  }
  if (normalized.includes("CHEQUE") || normalized.includes("CHECK")) {
    return {
      label: "Cheque",
      icon: (
        <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      ),
      bg: "bg-purple-50 dark:bg-purple-950/20"
    };
  }
  return {
    label: "Cash",
    icon: (
      <svg className="w-4 h-4 text-amber-600 dark:text-amber-450" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5M5.25 7.5h13.5m-12 3h10.5m-9 3h7.5m-6 3h4.5m-3.25 3h2" />
      </svg>
    ),
    bg: "bg-amber-50 dark:bg-amber-950/20"
  };
};

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
  studentName = "Student"
}) => {
  const [mounted, setMounted] = useState(false);
  const { data: payments = [] } = usePayments();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !invoice || !mounted) return null;

  const invoicePayments = payments.filter((p: any) => p.invoiceId === invoice.id);

  const handlePrint = () => {
    window.print();
  };

  // Render modal inside a React Portal to break out of CSS stacking context limits (i.e. sidebar overlay fix)
  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-[99999] p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 animate-scale overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          title="Close"
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
                  <span className="text-xs text-[#256ff1] font-bold uppercase tracking-wider">German School</span>
                </div>
              </div>
              <p className="text-xs text-slate-550 dark:text-slate-400 mt-2">
                Goethestrasse 12, 803 Munich<br />
                info@cianna.de | www.cianna.de
              </p>
            </div>
            <div className="mt-4 md:mt-0 text-left md:text-right">
              <h3 className="text-2xl font-black uppercase text-slate-400 dark:text-slate-600 tracking-wide">INVOICE</h3>
              <p className="text-sm font-semibold mt-1">Invoice Number: <span className="font-mono">{invoice.id}</span></p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Issued Date: {invoice.createdAt}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Invoice Recipient</h4>
              <p className="text-base font-bold">{studentName}</p>
              <p className="text-sm text-slate-550 dark:text-slate-400">Student of Cianna German School</p>
            </div>
            <div className="md:text-right">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Payment Information</h4>
              <p className="text-sm">Due Date: <span className="font-semibold">{invoice.dueDate}</span></p>
              <div className="mt-2 md:float-right">
                {invoice.status === "Paid" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Paid
                  </span>
                ) : invoice.status === "Partially Paid" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Partially Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    Unpaid
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
                  <th className="py-3 font-bold text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider w-3/4">Description</th>
                  <th className="py-3 font-bold text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 dark:border-slate-800/50">
                  <td className="py-4">
                    <p className="font-semibold">{invoice.description}</p>
                    <p className="text-xs text-slate-550 dark:text-slate-400 mt-0.5">Language course fee & course materials</p>
                  </td>
                  <td className="py-4 text-right font-mono font-semibold">{invoice.amount.toLocaleString()} KSh</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Grand Total */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className={`flex flex-col md:flex-row ${invoicePayments.length > 0 ? "justify-between" : "justify-end"} gap-6 md:gap-8`}>
              {invoicePayments.length > 0 && (
                <div className="w-full md:w-1/2 flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Payment History
                  </h4>
                  <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                    {invoicePayments.map((payment) => {
                      const details = getPaymentMethodDetails(payment.paymentMethod);
                      return (
                        <div 
                          key={payment.id} 
                          className="flex flex-col gap-1 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`p-1.5 rounded-lg ${details.bg}`}>
                                {details.icon}
                              </span>
                              <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{details.label}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500">{payment.date}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                                +{payment.amount.toLocaleString()} KSh
                              </p>
                            </div>
                          </div>
                          {payment.transactionReference && (
                            <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-100/70 dark:border-slate-800/40 text-[10px]">
                              <span className="text-slate-400 dark:text-slate-500 font-medium">Ref / Receipt:</span>
                              <span className="font-mono font-bold bg-[#256ff1]/10 text-[#256ff1] dark:text-[#528cf7] px-2 py-0.5 rounded-md uppercase tracking-wider">
                                {payment.transactionReference}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="w-full md:w-1/2 flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm text-slate-550 dark:text-slate-400">
                  <span>Invoice Total:</span>
                  <span className="font-mono">{invoice.amount.toLocaleString()} KSh</span>
                </div>
                <div className="flex justify-between items-center text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Amount Paid:</span>
                  <span className="font-mono">{(invoice.paidAmount || 0).toLocaleString()} KSh</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold border-t border-slate-200 dark:border-slate-800 pt-2 text-[#256ff1]">
                  <span>Balance Due:</span>
                  <span className="font-mono">{(invoice.amount - (invoice.paidAmount || 0)).toLocaleString()} KSh</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-6 no-print">
          <button 
            type="button"
            onClick={onClose} 
            className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-slate-750 dark:hover:bg-slate-300 font-semibold cursor-pointer transition-all duration-200"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
