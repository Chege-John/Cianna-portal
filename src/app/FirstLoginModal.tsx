"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash, FaLock, FaSpinner } from "react-icons/fa";

interface FirstLoginInfoType {
  isFirstLogin: boolean;
  requiresPasswordChange: boolean;
  requiresPinChange: boolean;
}

interface FirstLoginModalProps {
  isOpen: boolean;
  firstLoginData: FirstLoginInfoType | null;
  onComplete: () => void;
}

// Toast styles for consistency
const toastStyles = {
  success: {
    style: {
      background: "#10b981",
      color: "#ffffff",
      padding: "16px",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "500",
      boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.3), 0 4px 6px -2px rgba(16, 185, 129, 0.2)",
    },
    iconTheme: {
      primary: "#ffffff",
      secondary: "#10b981",
    },
  },
  error: {
    style: {
      background: "#ef4444",
      color: "#ffffff",
      padding: "16px",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "500",
      boxShadow: "0 10px 15px -3px rgba(239, 68, 68, 0.3), 0 4px 6px -2px rgba(239, 68, 68, 0.2)",
    },
    iconTheme: {
      primary: "#ffffff",
      secondary: "#ef4444",
    },
  },
};

export default function FirstLoginModal({
  isOpen,
  firstLoginData,
  onComplete,
}: FirstLoginModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !firstLoginData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long", {
        position: "bottom-left",
        duration: 4000,
        ...toastStyles.error,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match", {
        position: "bottom-left",
        duration: 4000,
        ...toastStyles.error,
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate security provisioning delay
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    setIsSubmitting(false);
    toast.success("Account secured successfully!", {
      position: "bottom-left",
      duration: 3000,
      ...toastStyles.success,
    });
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with elegant glassmorphism */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300"
        onClick={() => {
          // Prevent closing by clicking outside to enforce password setup
          toast.error("Please complete your security setup first", {
            position: "bottom-left",
            duration: 3000,
            ...toastStyles.error,
          });
        }}
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 transition-all duration-300 p-8 transform scale-100">
        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 text-[#256ff1]">
            <FaLock className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Secure Your Account
          </h3>
          <p className="text-gray-500 text-sm">
            This is your first time signing in. Please set a new secure password to activate your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-850 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 placeholder-slate-400 bg-slate-50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <FaEyeSlash className="w-5 h-5" />
                ) : (
                  <FaEye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-850 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 placeholder-slate-400 bg-slate-50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#256ff1] hover:bg-[#3b7eff] text-white font-semibold py-3.5 rounded-xl 
              transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-98 
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none 
              shadow-sm hover:shadow-md shadow-[#256ff1]/20 mt-4 flex items-center justify-center cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <FaSpinner className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Saving security settings...
              </span>
            ) : (
              "Complete Setup & Enter"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
