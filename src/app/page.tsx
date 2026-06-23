"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSchool, type Role } from "@/context/SchoolContext";
import toast, { Toaster } from "react-hot-toast";
import FirstLoginModal from "./FirstLoginModal";
import Image from "next/image";
import { FaEye, FaEyeSlash, FaSpinner } from "react-icons/fa";

// Toast styles matching original requested layout
const toastStyles = {
  success: {
    style: {
      background: "#10b981",
      color: "#ffffff",
      padding: "16px",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "500",
      boxShadow:
        "0 10px 15px -3px rgba(16, 185, 129, 0.3), 0 4px 6px -2px rgba(16, 185, 129, 0.2)",
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
      boxShadow:
        "0 10px 15px -3px rgba(239, 68, 68, 0.3), 0 4px 6px -2px rgba(239, 68, 68, 0.2)",
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


interface InputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  id?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  id,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && showPassword ? "text" : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-4 py-3 backdrop-blur-md border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 placeholder-slate-400 bg-white"
          style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
        />
        {isPassword && (
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
        )}
      </div>
    </div>
  );
};
interface FirstLoginInfoType {
  isFirstLogin: boolean;
  requiresPasswordChange: boolean;
  requiresPinChange: boolean;
}

export default function Login() {
  const [loginMethod, setLoginMethod] = useState<"phone" | "email">("email");
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);
  const [firstLoginData, setFirstLoginData] = useState<FirstLoginInfoType | null>(null);
  
  const { login, isLoading } = useAuth();
  const { users, currentUser } = useSchool();
  const router = useRouter();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (currentUser) {
      router.push("/dashboard");
    }
  }, [currentUser, router]);

  const validatePhone = (phone: string): boolean => {
    const re =
      /^[\\+]?[(]?[0-9]{1,4}[)]?[-\s\\.]?[(]?[0-9]{1,4}[)]?[-\s\\.]?[0-9]{1,9}$/;
    return re.test(phone.replace(/\s/g, ""));
  };

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loginMethod === "phone" && !validatePhone(credential)) {
      toast.error("Please enter a valid phone number", {
        position: "bottom-left",
        duration: 4000,
        ...toastStyles.error,
      });
      return;
    }

    if (loginMethod === "email" && !validateEmail(credential)) {
      toast.error("Please enter a valid email address", {
        position: "bottom-left",
        duration: 4000,
        ...toastStyles.error,
      });
      return;
    }

    if (!password) {
      toast.error("Please enter a password", {
        position: "bottom-left",
        duration: 4000,
        ...toastStyles.error,
      });
      return;
    }

    try {
      const firstLoginInfo = await login(credential, password);

      console.log('Login.tsx received firstLoginInfo:', firstLoginInfo);

      // Check if user needs to complete first login setup
      if (firstLoginInfo && firstLoginInfo.isFirstLogin) {
        console.log('Showing first login modal');
        toast.success("Welcome! Please secure your account.", {
          position: "bottom-left",
          duration: 3000,
          ...toastStyles.success,
        });
        setFirstLoginData(firstLoginInfo);
        setShowFirstLoginModal(true);
      } else {
        toast.success("Login successful!", {
          position: "bottom-left",
          duration: 3000,
          ...toastStyles.success,
        });
        router.push("/dashboard");
      }
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        const apiError = error as {
          response?: { data?: { message?: string } };
        };
        const errorMessage =
          apiError.response?.data?.message ||
          "Invalid credentials. Please try again.";
        toast.error(errorMessage, {
          position: "bottom-left",
          duration: 4000,
          ...toastStyles.error,
        });
      } else if (error instanceof Error) {
        toast.error(error.message, {
          position: "bottom-left",
          duration: 4000,
          ...toastStyles.error,
        });
      } else {
        toast.error("Invalid credentials. Please try again.", {
          position: "bottom-left",
          duration: 4000,
          ...toastStyles.error,
        });
      }
    }
  };

  const handleQuickLogin = async (email: string) => {
    setCredential(email);
    setPassword(""); // Keep password input blank so user enters it themselves
    toast.success("Demo profile selected. Please enter password.", {
      position: "bottom-left",
      duration: 4000,
      ...toastStyles.success,
    });
  };

  return (
    <>
      <AuthLayout>
        <div className="w-full">
          <div className="mb-4">
            <div className="w-36 h-auto overflow-hidden mb-5">
              <Image
                src="/cli.jpg"
                alt="RMS Logo"
                width={100}
                height={100}
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1.5">
              Welcome Back
            </h2>
            <p className="text-gray-500 text-sm">
              Please enter your credentials to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div
              className="flex gap-2 p-1 rounded-xl mb-4"
              style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
            >
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("email");
                  setCredential("");
                }}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer ${
                  loginMethod === "email"
                    ? "bg-white text-[#256ff1] shadow-sm scale-[1.02]"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("phone");
                  setCredential("");
                }}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer ${
                  loginMethod === "phone"
                    ? "bg-white text-[#256ff1] shadow-sm scale-[1.02]"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Phone Number
              </button>
            </div>

            <Input
              id="credential-input"
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
              label={loginMethod === "phone" ? "Phone Number" : "Email Address"}
              placeholder={
                loginMethod === "phone" ? "+254712345678" : "you@example.com"
              }
              type={loginMethod === "phone" ? "tel" : "email"}
            />

            <Input
              id="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              label="Password"
              placeholder="Enter your password"
              type="password"
            />

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

            <div className="text-center mt-6 space-y-4 pt-2">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => toast("Registrations are managed by system administrators.", { icon: "🏛️" })}
                  className="text-[#256ff1]/90 hover:text-[#256ff1] hover:underline font-semibold cursor-pointer"
                >
                  Sign up
                </button>
              </p>
            </div>
          </form>

        </div>
      </AuthLayout>

      {/* First Login Modal */}
      <FirstLoginModal
        isOpen={showFirstLoginModal}
        firstLoginData={firstLoginData}
        onComplete={() => {
          setShowFirstLoginModal(false);
          setFirstLoginData(null);
          router.push("/dashboard");
        }}
      />

      <Toaster position="bottom-left" reverseOrder={false} />
    </>
  );
}
