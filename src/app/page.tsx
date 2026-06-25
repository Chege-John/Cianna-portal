"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSchool } from "@/context/SchoolContext";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";
import { FaEye, FaEyeSlash, FaSpinner } from "react-icons/fa";

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
    iconTheme: { primary: "#ffffff", secondary: "#10b981" },
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
    iconTheme: { primary: "#ffffff", secondary: "#ef4444" },
  },
};

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen w-full bg-white overflow-x-hidden">
    <div className="hidden md:block relative overflow-hidden bg-[#256ff1] h-full w-full rounded-r-[3.5rem]">
      <Image
        src="/login.webp"
        alt="Cianna Deutsch-Institut"
        className="absolute inset-0 w-full h-full object-cover"
        fill
        sizes="50vw"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      <div className="absolute bottom-12 left-12 right-12 z-10">
        <h2 className="text-white font-bold text-[1.25rem] sm:text-[1.5rem] md:text-[2rem] lg:text-[2.5rem] leading-tight">
          Sprachinstitut Cianna <br />
          <span className="block md:inline">Zukunft durch Sprache</span>
        </h2>
      </div>
    </div>
    <div className="px-8 md:px-16 py-12 flex items-center justify-center bg-white w-full h-full">
      <div className="w-full max-w-md">{children}</div>
    </div>
  </div>
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const { currentUser } = useSchool();
  const router = useRouter();

  useEffect(() => {
    if (currentUser) {
      router.push("/dashboard");
    }
  }, [currentUser, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address", {
        position: "bottom-left", duration: 4000, ...toastStyles.error,
      });
      return;
    }

    if (!password) {
      toast.error("Please enter your password", {
        position: "bottom-left", duration: 4000, ...toastStyles.error,
      });
      return;
    }

    try {
      await login(email.trim(), password);
      router.push("/dashboard");
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : "Invalid credentials. Please try again.";
      toast.error(message, {
        position: "bottom-left", duration: 4000, ...toastStyles.error,
      });
    }
  };

  return (
    <>
      <AuthLayout>
        <div className="w-full">
          <div className="mb-4">
            <div className="w-36 h-auto overflow-hidden mb-5">
              <Image
                src="/cli.jpg"
                alt="Cianna Logo"
                width={100}
                height={100}
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1.5">Welcome Back</h2>
            <p className="text-gray-500 text-sm">Please enter your credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-800 mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 backdrop-blur-md border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 placeholder-slate-400 bg-white"
                style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-800 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 backdrop-blur-md border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 placeholder-slate-400 bg-white"
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

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-[#256ff1] border-gray-300 rounded focus:ring-[#256ff1] accent-[#256ff1]"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <Link href="/forgot-password">
                <span className="text-sm text-[#256ff1] hover:underline font-medium cursor-pointer">
                  Forgot password?
                </span>
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#256ff1] hover:bg-[#3b7eff] text-white font-semibold py-3.5 rounded-xl 
                transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer
                shadow-sm hover:shadow-md shadow-[#256ff1]/30 mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <FaSpinner className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </AuthLayout>

      <Toaster position="bottom-left" reverseOrder={false} />
    </>
  );
}
