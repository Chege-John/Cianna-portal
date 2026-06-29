"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Invoice } from "@/context/SchoolContext";
import { useSchoolMutations, usePaymentSettings, useStudents } from "@/hooks/use-school-data";
import { FaMobileAlt, FaCreditCard, FaUniversity, FaSpinner, FaCheckCircle } from "react-icons/fa";
import { pusherClient } from "@/lib/pusher";
import { useQueryClient } from "@tanstack/react-query";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onPaymentSuccess: (invoiceId: string, method: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onPaymentSuccess
}) => {
  const queryClient = useQueryClient();
  const { initiatePayment } = useSchoolMutations();
  const { data: settings } = usePaymentSettings();
  const { data: students = [] } = useStudents();

  const [method, setMethod] = useState<"Card" | "Bank" | "STK">("STK");
  const [status, setStatus] = useState<"idle" | "processing" | "waiting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  // Form States
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && invoice) {
      const student = students.find(s => s.id === invoice.studentId);
      if (student?.phoneNumber) {
        setPhoneNumber(student.phoneNumber.replace(/\+/g, ""));
      }

      // Subscribe to Pusher channel for this invoice
      const channel = pusherClient.subscribe(`invoice-${invoice.id}`);
      channel.bind("payment-completed", (data: { status: string }) => {
        if (data.status === "Paid" || data.status === "Partially Paid") {
          // Invalidate cache immediately to pull real logged transactions
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
          queryClient.invalidateQueries({ queryKey: ["payments"] });
          queryClient.invalidateQueries({ queryKey: ["auditLogs"] });

          setStatus("success");
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

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setExpiry(value.length >= 2 ? `${value.slice(0, 2)}/${value.slice(2)}` : value);
  };

  const handleStkPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) {
      setErrorMessage("Payment gateway not configured. Please contact admin.");
      return;
    }

    setStatus("processing");
    setErrorMessage("");

    try {
      await initiatePayment.mutateAsync({
        amount: invoice.amount,
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

      // Show real-time waiting prompt
      setStatus("waiting");
    } catch (error: any) {
      setStatus("idle");
      setErrorMessage(error.message || "Failed to initiate payment. Please try again.");
    }
  };

  const handleSimulatedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("processing");
    setTimeout(() => {
      setStatus("success");
      setTimeout(() => {
        onPaymentSuccess(invoice.id, method === "Card" ? "Credit Card" : "Bank Transfer");
        onClose();
        setStatus("idle");
      }, 1500);
    }, 2000);
  };

  // Render modal inside a React Portal to break out of CSS stacking context limits (i.e. sidebar overlay fix)
  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-[99999] p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 text-center">
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Checkout</h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">{invoice.description}</p>
          
          <div className="mt-4 inline-flex flex-col items-center">
            <span className="text-xs text-slate-400 font-bold uppercase">Amount Due</span>
            <span className="text-3xl font-black text-[#256ff1]">KSh {invoice.amount.toLocaleString()}</span>
          </div>
        </div>

        {status === "idle" && (
          <div className="p-6">
            {/* Method Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl mb-6">
              <button 
                type="button"
                onClick={() => setMethod("STK")}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${method === "STK" ? "bg-white dark:bg-slate-700 text-[#256ff1] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <FaMobileAlt /> M-PESA
              </button>
              <button 
                type="button"
                onClick={() => setMethod("Card")}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${method === "Card" ? "bg-white dark:bg-slate-700 text-[#256ff1] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <FaCreditCard /> Card
              </button>
              <button 
                type="button"
                onClick={() => setMethod("Bank")}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${method === "Bank" ? "bg-white dark:bg-slate-700 text-[#256ff1] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <FaUniversity /> Bank
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-lg text-center">
                {errorMessage}
              </div>
            )}

            {method === "STK" ? (
              <form onSubmit={handleStkPush} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">M-PESA Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">+254</span>
                    <input 
                      type="tel" required placeholder="712345678" value={phoneNumber.replace(/^254/, "")}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-14 pr-4 py-3 bg-slate-50 dark:bg-slate-850 border-2 border-slate-100 dark:border-slate-800 rounded-xl focus:border-[#256ff1] outline-none transition-all font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-[#256ff1] hover:bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-500/20 transition-all transform active:scale-95 cursor-pointer"
                >
                  Request STK Push
                </button>
                <p className="text-[10px] text-center text-slate-400 font-medium">You will receive an M-PESA prompt on your phone to enter your PIN.</p>
              </form>
            ) : method === "Card" ? (
              <form onSubmit={handleSimulatedSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">Cardholder Name</label>
                  <input 
                    type="text" required placeholder="John Doe" value={cardholderName} onChange={(e) => setCardholderName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border-2 border-slate-100 dark:border-slate-800 rounded-xl focus:border-[#256ff1] outline-none transition-all font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">Card Number</label>
                  <input 
                    type="text" required placeholder="4500 1234 5678 9012" value={cardNumber} onChange={handleCardNumberChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border-2 border-slate-100 dark:border-slate-800 rounded-xl focus:border-[#256ff1] outline-none transition-all font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="text" required placeholder="MM/YY" value={expiry} onChange={handleExpiryChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border-2 border-slate-100 dark:border-slate-800 rounded-xl focus:border-[#256ff1] outline-none transition-all font-bold text-slate-800 dark:text-slate-100"
                  />
                  <input 
                    type="password" required placeholder="CVV" maxLength={3} value={cvv} onChange={(e) => setCvv(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border-2 border-slate-100 dark:border-slate-800 rounded-xl focus:border-[#256ff1] outline-none transition-all font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-[#256ff1] hover:bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-500/20 transition-all transform active:scale-95 cursor-pointer"
                >
                  Pay Securely
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl text-xs space-y-2">
                  <p className="font-black text-slate-800 dark:text-slate-200">Bank Transfer Details</p>
                  <div className="space-y-1 font-mono text-slate-500">
                    <p>Bank: {settings?.bankName || "NCBA"}</p>
                    <p>Acc No: {settings?.accountReference || "123456789"}</p>
                    <p>Ref: {invoice.id}</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={handleSimulatedSubmit}
                  className="w-full py-4 border-2 border-[#256ff1] text-[#256ff1] hover:bg-blue-50 font-black rounded-xl transition-all cursor-pointer"
                >
                  I have transferred the funds
                </button>
              </div>
            )}
          </div>
        )}

        {status === "processing" && (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <FaSpinner className="text-4xl text-[#256ff1] animate-spin" />
            <div className="text-center">
              <h3 className="font-black text-slate-900 dark:text-slate-100">Processing Payment</h3>
              <p className="text-xs text-slate-500 mt-1 font-bold">Please wait while we secure your transaction...</p>
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
              <p className="text-xs text-slate-500 font-bold leading-relaxed px-2">
                Please check your phone for the M-PESA PIN prompt to authorize your payment of <span className="text-[#256ff1]">KSh {invoice.amount.toLocaleString()}</span>.
              </p>
              <div className="mt-4 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100/40 dark:border-emerald-900/20 inline-block animate-pulse">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                  Waiting for Safaricom Confirmation...
                </p>
              </div>
              
              {/* Reset/Cancel & Redo button to re-trigger prompt or change number */}
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-6 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer border border-slate-200/40 dark:border-slate-700/40"
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
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-xl">Payment Verified!</h3>
              <p className="text-xs text-slate-500 mt-1 font-bold">Your payment has been successfully recorded in the ledger. Thank you!</p>
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
              Close & Check Status Later
            </button>
          ) : (
            <button 
              type="button"
              onClick={onClose} 
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Cancel Transaction
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
