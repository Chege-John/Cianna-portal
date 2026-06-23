"use client";

import React, { useState } from "react";
import { Invoice } from "@/context/SchoolContext";

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
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [method, setMethod] = useState("Kreditkarte");

  if (!isOpen || !invoice) return null;

  // Format Card Number (adds spaces every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
    setCardNumber(formatted);
  };

  // Format Expiry (adds slash)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (value.length >= 2) {
      setExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
    } else {
      setExpiry(value);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 3);
    setCvv(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !expiry || !cvv || !cardholderName) return;

    setStatus("processing");

    // Simulate payment validation and processing
    setTimeout(() => {
      setStatus("success");
      setTimeout(() => {
        onPaymentSuccess(invoice.id, method);
        setStatus("idle");
        // Reset inputs
        setCardNumber("");
        setExpiry("");
        setCvv("");
        setCardholderName("");
        onClose();
      }, 1200);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[2000] p-4 bg-slate-900/60 backdrop-blur-sm animate-fade">
      {/* Modal Box */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 animate-scale">
        
        {/* Close Button (only if not processing) */}
        {status !== "processing" && status !== "success" && (
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            title="Schließen"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}

        {status === "idle" && (
          <>
            <div className="mb-5 text-center">
              <span className="text-3xl">💳</span>
              <h2 className="text-xl font-extrabold text-slate-805 dark:text-slate-100 mt-2">Gebühren sicher bezahlen</h2>
              <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">Rechnungskonto: {invoice.description}</p>
              
              {/* Amount Display */}
              <div className="mt-4 py-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block">Zu zahlender Betrag</span>
                <span className="text-2xl font-black text-brand-indigo-600 dark:text-brand-indigo-400 mt-0.5 block">{invoice.amount.toFixed(2)} €</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="flex gap-2 mb-4 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg">
              <button 
                type="button"
                onClick={() => setMethod("Kreditkarte")}
                className={`flex-1 text-center py-2 text-xs font-bold rounded-md cursor-pointer transition-colors ${method === "Kreditkarte" ? "bg-white dark:bg-slate-700 text-brand-indigo-600 dark:text-brand-indigo-400 shadow-sm" : "text-slate-550 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200"}`}
              >
                Kreditkarte
              </button>
              <button 
                type="button"
                onClick={() => setMethod("Banküberweisung")}
                className={`flex-1 text-center py-2 text-xs font-bold rounded-md cursor-pointer transition-colors ${method === "Banküberweisung" ? "bg-white dark:bg-slate-700 text-brand-indigo-600 dark:text-brand-indigo-400 shadow-sm" : "text-slate-550 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200"}`}
              >
                Banküberweisung
              </button>
            </div>

            {method === "Banküberweisung" ? (
              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-xl bg-brand-indigo-50/50 dark:bg-brand-indigo-500/5 border border-brand-indigo-150/30 dark:border-brand-indigo-500/10 text-sm">
                  <p className="font-bold text-slate-800 dark:text-slate-100">Simulierte Überweisung</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Bitte führen Sie eine Überweisung auf unser deutsches IBAN-Konto aus. Das System bucht die Zahlung nach Klick auf "Simulation bestätigen" sofort ein.
                  </p>
                  <div className="mt-3 space-y-1 font-mono text-xs text-slate-600 dark:text-slate-350">
                    <p>Empfänger: Cianna GmbH</p>
                    <p>IBAN: DE89 3704 0044 0532 0130 00</p>
                    <p>BIC: WELADED1MUN</p>
                    <p>Verwendungszweck: {invoice.id}</p>
                  </div>
                </div>

                <button 
                  onClick={handleSubmit}
                  className="w-full py-3 rounded-lg bg-brand-indigo-650 hover:bg-brand-indigo-700 text-white font-bold text-sm shadow-lg hover:shadow-brand-indigo-650/20 cursor-pointer transition-all duration-200"
                >
                  Simulation bestätigen
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Cardholder Name */}
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Karteninhaber</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Max Mustermann"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-brand-indigo-500 focus:ring-2 focus:ring-brand-indigo-500/10 outline-none transition-all"
                  />
                </div>

                {/* Card Number */}
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Kartennummer</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="4500 1234 5678 9012"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-brand-indigo-500 focus:ring-2 focus:ring-brand-indigo-500/10 outline-none transition-all"
                  />
                </div>

                {/* Expiry and CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Gültig bis</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="MM/JJ"
                      value={expiry}
                      onChange={handleExpiryChange}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-brand-indigo-500 focus:ring-2 focus:ring-brand-indigo-500/10 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">CVC / CVV</label>
                    <input 
                      type="password" 
                      required 
                      placeholder="123"
                      value={cvv}
                      onChange={handleCvvChange}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-brand-indigo-500 focus:ring-2 focus:ring-brand-indigo-500/10 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Pay Button */}
                <button 
                  type="submit"
                  className="w-full mt-2 py-3 rounded-lg bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white font-bold text-sm shadow-lg hover:shadow-brand-indigo-650/20 cursor-pointer transition-all duration-200"
                >
                  Jetzt bezahlen ({invoice.amount.toFixed(2)} €)
                </button>
              </form>
            )}
          </>
        )}

        {/* Processing State */}
        {status === "processing" && (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full border-[3px] border-slate-200 dark:border-slate-800 border-t-brand-indigo-600 animate-spin" />
            <div>
              <p className="font-bold text-base">Zahlung wird verarbeitet...</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Deutsche Bank Secure Transaktion läuft</p>
            </div>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-4 animate-scale">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div>
              <p className="font-black text-lg text-emerald-600 dark:text-emerald-400">Zahlung erfolgreich!</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ihre Kursgebühr wurde beglichen. Vielen Dank!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
