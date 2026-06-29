"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Invoice } from "@/context/SchoolContext";
import { useSchoolMutations, usePaymentSettings, useStudents } from "@/hooks/use-school-data";
import { FaMobileAlt, FaMoneyBillWave, FaCheckDouble, FaSpinner, FaCheckCircle, FaTimes } from "react-icons/fa";
import { pusherClient } from "@/lib/pusher";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface AdminPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export const AdminPaymentModal: React.FC<AdminPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const queryClient = useQueryClient();
  const { initiatePayment, payInvoice } = useSchoolMutations();
  const { data: settings } = usePaymentSettings();
  const { data: students = [] } = useStudents();

  const [method, setMethod] = useState<"STK" | "Cash" | "Cheque" | "MpesaManual">("STK");
  const [status, setStatus] = useState<"idle" | "processing" | "waiting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && invoice) {
      const student = students.find(s => s.id === invoice.studentId);
      if (student?.phoneNumber) {
        setPhoneNumber(student.phoneNumber.replace(/\+/g, ""));
      }
      setAmount((invoice.amount - (invoice.paidAmount || 0)).toString());

      // Subscribe to Pusher channel for real-time STK updates
      const channel = pusherClient.subscribe(`invoice-${invoice.id}`);
      channel.bind("payment-completed", (data: { status: string }) => {
        if (data.status === "Paid" || data.status === "Partially Paid") {
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
          queryClient.invalidateQueries({ queryKey: ["payments"] });
          queryClient.invalidateQueries({ queryKey: ["auditLogs"] });

          setStatus("success");
          toast.success("Payment settled successfully via Safaricom!");
          setTimeout(() => {
            onClose();
            setStatus("idle");
          }, 3000);
        }
      });

      channel.bind("payment-failed", (data: { message?: string }) => {
        const msg = data.message || "M-PESA transaction was cancelled or failed.";
        setErrorMessage(msg);
        setStatus("error");
        toast.error(msg);
        setTimeout(() => {
          onClose();
          setStatus("idle");
          setErrorMessage("");
        }, 3500);
      });

      return () => {
        pusherClient.unsubscribe(`invoice-${invoice.id}`);
      };
    }
  }, [isOpen, invoice, students, onClose, queryClient]);

  if (!isOpen || !invoice || !mounted) return null;

  const balance = invoice.amount - (invoice.paidAmount || 0);

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const payAmt = parseFloat(amount);
    if (isNaN(payAmt) || payAmt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setStatus("processing");
    try {
      await payInvoice.mutateAsync({
        invoiceId: invoice.id,
        paymentMethod: method === "MpesaManual" ? "M-PESA" : method,
        amount: payAmt,
        reference: reference
      });
      setStatus("success");
      toast.success("Payment recorded successfully");
      setTimeout(() => {
        onClose();
        setStatus("idle");
      }, 1500);
    } catch (err) {
      setStatus("idle");
      toast.error("Failed to record payment");
    }
  };

  const handleStkPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) {
      toast.error("Payment gateway not configured");
      return;
    }

    setStatus("processing");
    try {
      await initiatePayment.mutateAsync({
        amount: parseFloat(amount),
        phoneNumber: phoneNumber.startsWith("254") ? phoneNumber : `254${phoneNumber.replace(/^0/, "")}`,
        orderId: `INV_${invoice.id}_${Date.now()}`,
        bankName: settings.bankName,
        accountReference: settings.accountReference,
        callbackUrl: (() => {
          if (typeof window !== "undefined") {
            const origin = window.location.origin;
            if (!origin.includes("localhost") && !origin.includes("127.0.0.1")) {
              return `${origin}/api/payments/callback`;
            }
          }
          return `${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "")}/api/payments/callback`;
        })(),
      });

      setStatus("waiting");
      toast.success("STK Push triggered!");
    } catch (err) {
      setStatus("idle");
      toast.error("Failed to send STK Push");
    }
  };

  // Render modal inside a React Portal to break out of CSS stacking context limits (i.e. sidebar overlay fix)
  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-scale-up border border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Record Payment</h2>
            <p className="text-xs text-slate-500 font-bold mt-0.5">Invoice: {invoice.id} • Balance: {balance.toLocaleString()} KSh</p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <FaTimes className="text-slate-400" />
          </button>
        </div>

        {status === "idle" && (
          <div className="p-6">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
              <button 
                type="button"
                onClick={() => setMethod("STK")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${method === "STK" ? "bg-white dark:bg-slate-700 text-[#256ff1] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <FaMobileAlt /> STK Push
              </button>
              <button 
                type="button"
                onClick={() => setMethod("Cash")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${method === "Cash" ? "bg-white dark:bg-slate-700 text-[#256ff1] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <FaMoneyBillWave /> Cash
              </button>
              <button 
                type="button"
                onClick={() => setMethod("Cheque")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${method === "Cheque" ? "bg-white dark:bg-slate-700 text-[#256ff1] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <FaCheckDouble /> Cheque
              </button>
              <button 
                type="button"
                onClick={() => setMethod("MpesaManual")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${method === "MpesaManual" ? "bg-white dark:bg-slate-700 text-[#256ff1] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <FaMobileAlt /> M-PESA
              </button>
            </div>

            <form onSubmit={method === "STK" ? handleStkPush : handleManualPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">Payment Amount</label>
                  <input 
                    type="number" required placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border-2 border-slate-100 dark:border-slate-800 rounded-xl focus:border-[#256ff1] outline-none transition-all font-bold text-slate-800 dark:text-slate-100"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-bold">Max: {balance.toLocaleString()} KSh</p>
                </div>
                {method === "STK" ? (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">Student Phone</label>
                    <input 
                      type="tel" required placeholder="712345678" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border-2 border-slate-100 dark:border-slate-800 rounded-xl focus:border-[#256ff1] outline-none transition-all font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">Reference No.</label>
                    <input 
                      type="text" placeholder={method === "Cheque" ? "Cheque #" : "Transaction ID"} value={reference} onChange={(e) => setReference(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border-2 border-slate-100 dark:border-slate-800 rounded-xl focus:border-[#256ff1] outline-none transition-all font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                )}
              </div>

              <button 
                type="submit"
                disabled={payInvoice.isPending || initiatePayment.isPending}
                className="w-full py-4 bg-[#256ff1] hover:bg-blue-600 disabled:bg-blue-400 text-white font-black rounded-xl shadow-lg shadow-blue-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {method === "STK" ? "Initiate STK Push" : "Record Manual Payment"}
              </button>
            </form>
          </div>
        )}

        {status === "processing" && (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <FaSpinner className="text-4xl text-[#256ff1] animate-spin" />
            <div className="text-center">
              <h3 className="font-black text-slate-900 dark:text-slate-100">Processing Request</h3>
              <p className="text-xs text-slate-500 mt-1 font-bold">Please wait...</p>
            </div>
          </div>
        )}

        {status === "waiting" && (
          <div className="p-12 flex flex-col items-center justify-center gap-6 text-center">
            <div className="relative flex items-center justify-center">
              <div className="w-20 h-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <FaMobileAlt className="text-3xl text-emerald-500 absolute animate-pulse" />
            </div>
            <div className="space-y-2 flex flex-col items-center">
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-lg">STK Push Sent!</h3>
              <p className="text-xs text-slate-500 font-bold leading-relaxed px-4">
                Sent prompt of <span className="text-[#256ff1]">KSh {parseFloat(amount).toLocaleString()}</span> to student's handset (+{phoneNumber}).
              </p>
              <div className="mt-4 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100/40 dark:border-emerald-900/20 inline-block animate-pulse">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                  Waiting for Student Authorization...
                </p>
              </div>

              {/* Reset/Cancel & Redo button to allow re-trying STK triggers */}
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-6 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer border border-slate-200/40 dark:border-slate-700/40"
              >
                Cancel & Try Another Number
              </button>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="p-12 flex flex-col items-center justify-center gap-4 animate-scale-up">
            <FaCheckCircle className="text-6xl text-emerald-500" />
            <div className="text-center">
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-xl">Action Successful!</h3>
              <p className="text-xs text-slate-500 mt-1 font-bold">The system has been updated. Thank you!</p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="p-12 flex flex-col items-center justify-center gap-4 animate-scale-up">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full flex items-center justify-center border border-rose-100 dark:border-rose-900/30 animate-pulse">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <div className="text-center">
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-xl">Payment Cancelled</h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 font-bold px-4 leading-relaxed">
                {errorMessage || "The transaction was cancelled or failed."}
              </p>
              <p className="text-[10px] text-slate-400 mt-4 font-semibold uppercase tracking-wider">
                Closing checkout...
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex justify-center">
          {status === "waiting" ? (
            <button 
              type="button"
              onClick={onClose} 
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Close & Wait for Payment
            </button>
          ) : (
            <button 
              type="button"
              onClick={onClose} 
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Close Modal
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
