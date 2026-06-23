"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSchool } from "./SchoolContext";

// Define the FirstLoginInfoType shape matching user's requested types
export interface FirstLoginInfoType {
  isFirstLogin: boolean;
  requiresPasswordChange: boolean;
  requiresPinChange: boolean;
}

interface AuthContextType {
  isLoading: boolean;
  login: (credential: string, password?: string) => Promise<FirstLoginInfoType | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { login: schoolLogin, users } = useSchool();
  const [isLoading, setIsLoading] = useState(false);

  const login = async (credential: string, password?: string): Promise<FirstLoginInfoType | null> => {
    setIsLoading(true);
    
    // Simulate real network delay for authentication
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Normalize credential
    const normalizedCred = credential.trim().toLowerCase();

    // Check if the user is logging in using a test profile
    const matchedUser = users.find(
      (u) =>
        u.email.toLowerCase() === normalizedCred ||
        u.email.toLowerCase().startsWith(normalizedCred)
    );

    setIsLoading(false);

    if (matchedUser) {
      // Determine expected password (respecting dynamic password resets saved in localStorage first)
      const userWithPwd = matchedUser as { email: string; password?: string };
      const expectedPassword =
        userWithPwd.password ||
        (matchedUser.email.toLowerCase() === "johnirunguchege2000@gmail.com"
          ? "12345678"
          : "changeme");

      if (password !== expectedPassword) {
        throw new Error("Invalid password. Please enter the correct password for this account.");
      }

      // Perform the local context login
      schoolLogin(matchedUser.email);

      // Check if it is a "first login" scenario
      // For demonstration and testing purposes, we can trigger the setup modal if the password is "changeme"
      // or if they login as "Lukas Meier" (lukas@student.de) with password "changeme" or standard setup triggers.
      if (password === "changeme") {
        return {
          isFirstLogin: true,
          requiresPasswordChange: true,
          requiresPinChange: false,
        };
      }

      return null;
    } else {
      // If no local mock user, we can support a generic successful flow, or throw an error for unrecognized inputs
      if (normalizedCred.includes("@") && normalizedCred.includes(".")) {
        // Successful mock sign in for any valid email structure for demo convenience
        schoolLogin(credential);
        return null;
      }
      
      throw new Error("Invalid credentials. Please use a registered profile or valid email.");
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
