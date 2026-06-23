"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSchool } from "@/context/SchoolContext";
import toast, { Toaster } from "react-hot-toast";
import { 
  FaArrowLeft, 
  FaEnvelope, 
  FaKey, 
  FaLock, 
  FaEye, 
  FaEyeSlash, 
  FaSpinner, 
  FaCheckCircle 
} from "react-icons/fa";

// Toast styles for consistency with the login page
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

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen w-full bg-white overflow-x-hidden">
      {/* Sidebar Visual Image Area (Left) */}
      <div className="hidden md:block relative overflow-hidden bg-[#256ff1] h-full w-full rounded-r-[3.5rem]">
        <Image
          src="/login.webp"
          alt="Cianna Deutsch-Institut"
          className="absolute inset-0 w-full h-full object-cover"
          fill
          sizes="50vw"
          priority
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

        <div className="absolute bottom-12 left-12 right-12 z-10">
          <h2 className="text-white font-bold text-[1.25rem] sm:text-[1.5rem] md:text-[2rem] lg:text-[2.5rem] leading-tight">
            Sprachinstitut Cianna <br />
            <span className="block md:inline">Zukunft durch Sprache</span>
          </h2>
        </div>
      </div>

      {/* Form Area (Right) */}
      <div className="px-8 md:px-16 py-12 flex items-center justify-center bg-white w-full h-full">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
};

export default function ForgotPassword() {
  const router = useRouter();
  const { updateUserPassword, users, currentUser } = useSchool();

  // Redirect if already authenticated
  useEffect(() => {
    if (currentUser) {
      router.push("/dashboard");
    }
  }, [currentUser, router]);

  // Flow States: 'request' | 'verify' | 'success'
  const [step, setStep] = useState<"request" | "verify" | "success">("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const validateEmail = (val: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(val.trim());
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!validateEmail(cleanEmail)) {
      toast.error("Please enter a valid email address", {
        position: "bottom-left",
        duration: 4000,
        ...toastStyles.error,
      });
      return;
    }

    // Client-side quick validation to give helpful instant feedback
    const matchedLocal = users.some(u => u.email.toLowerCase() === cleanEmail.toLowerCase());
    if (!matchedLocal) {
      toast.error("This email address is not registered in our records.", {
        position: "bottom-left",
        duration: 4000,
        ...toastStyles.error,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to dispatch verification code.");
      }

      toast.success("Security OTP sent successfully!", {
        position: "bottom-left",
        duration: 4000,
        ...toastStyles.success,
      });

      setStep("verify");
      setResendCooldown(60); // 60-second throttling cooldown
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred. Please try again.", {
        position: "bottom-left",
        duration: 4000,
        ...toastStyles.error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length !== 6 || isNaN(Number(cleanOtp))) {
      toast.error("Please enter a valid 6-digit verification code.", {
        position: "bottom-left",
        duration: 4000,
        ...toastStyles.error,
      });
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.", {
        position: "bottom-left",
        duration: 4000,
        ...toastStyles.error,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.", {
        position: "bottom-left",
        duration: 4000,
        ...toastStyles.error,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          otp: cleanOtp,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed.");
      }

      // Sync updated password state directly to client context and local storage
      updateUserPassword(cleanEmail, newPassword);

      toast.success("Password reset successfully synchronized!", {
        position: "bottom-left",
        duration: 4000,
        ...toastStyles.success,
      });

      setStep("success");
    } catch (error: any) {
      toast.error(error.message || "Verification failed. Please check the code.", {
        position: "bottom-left",
        duration: 4000,
        ...toastStyles.error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to dispatch verification code.");
      }

      toast.success("A new verification OTP code has been dispatched.", {
        position: "bottom-left",
        duration: 4000,
        ...toastStyles.success,
      });

      setResendCooldown(60);
    } catch (error: any) {
      toast.error(error.message || "Could not resend code. Please try again.", {
        position: "bottom-left",
        duration: 4000,
        ...toastStyles.error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AuthLayout>
        {step === "request" && (
          <div className="w-full">
            <div className="mb-6">
              <div className="w-36 h-auto overflow-hidden mb-6">
                <Image
                  src="/cli.jpg"
                  alt="Cianna Logo"
                  width={144}
                  height={50}
                  className="w-full h-auto object-contain"
                />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Reset Password
              </h2>
              <p className="text-gray-500 text-sm">
                Enter your registered email address below and we will send you a secure verification OTP code to reset your password.
              </p>
            </div>

            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <FaEnvelope className="w-5 h-5" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 placeholder-slate-400 bg-white"
                    style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#256ff1] hover:bg-[#3b7eff] text-white font-semibold py-3.5 rounded-xl 
                  transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer
                  shadow-sm hover:shadow-md shadow-[#256ff1]/30 mt-4 flex items-center justify-center"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <FaSpinner className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Sending OTP...
                  </span>
                ) : (
                  "Send OTP Code"
                )}
              </button>

              <div className="text-center pt-4">
                <Link href="/">
                  <span className="inline-flex items-center text-sm font-semibold text-[#256ff1] hover:underline cursor-pointer">
                    <FaArrowLeft className="w-3.5 h-3.5 mr-2" />
                    Back to Sign In
                  </span>
                </Link>
              </div>
            </form>
          </div>
        )}

        {step === "verify" && (
          <div className="w-full">
            <div className="mb-6">
              <div className="w-36 h-auto overflow-hidden mb-6">
                <Image
                  src="/cli.jpg"
                  alt="Cianna Logo"
                  width={144}
                  height={50}
                  className="w-full h-auto object-contain"
                />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Verify Security OTP
              </h2>
              <p className="text-gray-500 text-sm">
                An OTP verification code was sent to <strong className="text-slate-800">{email}</strong>. Enter the code and your new password to complete the reset.
              </p>
            </div>

            <form onSubmit={handleVerifyAndReset} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  6-Digit OTP Code
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <FaKey className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    required
                    className="w-full pl-11 pr-4 py-3 tracking-[0.25em] font-mono text-center text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 placeholder-slate-400 bg-white"
                    style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <FaLock className="w-5 h-5" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 placeholder-slate-400 bg-white"
                    style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer flex items-center justify-center"
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
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <FaLock className="w-5 h-5" />
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 placeholder-slate-400 bg-white"
                    style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#256ff1] hover:bg-[#3b7eff] text-white font-semibold py-3.5 rounded-xl 
                  transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer
                  shadow-sm hover:shadow-md shadow-[#256ff1]/30 mt-4 flex items-center justify-center"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <FaSpinner className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Resetting password...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </button>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isLoading}
                  className="text-sm font-semibold text-[#256ff1] disabled:text-gray-400 hover:underline disabled:no-underline cursor-pointer"
                >
                  {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : "Resend Code"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep("request")}
                  className="text-sm font-semibold text-gray-500 hover:text-gray-700 hover:underline cursor-pointer"
                >
                  Change Email
                </button>
              </div>
            </form>
          </div>
        )}

        {step === "success" && (
          <div className="w-full text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-sm">
                <FaCheckCircle className="w-10 h-10" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Success!
            </h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
              Your password has been successfully reset. Both the Postgres database and your local session variables have been securely synchronized.
            </p>

            <Link href="/">
              <span className="w-full inline-flex justify-center bg-[#256ff1] hover:bg-[#3b7eff] text-white font-semibold py-3.5 rounded-xl 
                transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]
                shadow-sm hover:shadow-md shadow-[#256ff1]/30 cursor-pointer">
                Back to Sign In
              </span>
            </Link>
          </div>
        )}
      </AuthLayout>

      <Toaster position="bottom-left" reverseOrder={false} />
    </>
  );
}
