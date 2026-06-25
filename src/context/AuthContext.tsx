"use client";

import React, { createContext, useContext, useState } from "react";
import { authClient } from "@/lib/auth-client";

export interface FirstLoginInfoType {
  isFirstLogin: boolean;
  requiresPasswordChange: boolean;
  requiresPinChange: boolean;
}

interface AuthContextType {
  isLoading: boolean;
  login: (credential: string, password: string) => Promise<FirstLoginInfoType | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  const login = async (credential: string, password: string): Promise<FirstLoginInfoType | null> => {
    setIsLoading(true);

    try {
      const email = credential.includes("@") ? credential.trim().toLowerCase() : "";
      const { error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message || "Invalid credentials. Please try again.");
      }

      // Wait for session to propagate through React Query
      for (let i = 0; i < 30; i++) {
        const { data: session } = await authClient.getSession();
        if (session?.user) return null;
        await new Promise((r) => setTimeout(r, 100));
      }

      throw new Error("Session could not be established. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoading, login }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
