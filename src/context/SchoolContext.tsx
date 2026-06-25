"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  getUsers,
  getClassrooms,
  getClassroomSubjects,
  getSubjects,
  getStudents,
  getTeachers,
  getGrades,
  getAttendance,
  getInvoices,
  getPayments,
  getAuditLogs,
  addStudentAction,
  addTeacherAction,
  addClassroomAction,
  createInvoiceAction,
  recordGradeAction,
  recordAttendanceAction,
  payInvoiceAction,
} from "@/server-actions/school";

export type Role = "super-admin" | "admin" | "teacher" | "student" | "parent";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  password?: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  classroomId: string;
  parentEmail?: string;
}

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  subjectId: string;
}

export interface Classroom {
  id: string;
  name: string;
  teacherId?: string;
  subjectIds: string[];
}

export interface Subject {
  id: string;
  name: string;
}

export interface Grade {
  id: string;
  studentId: string;
  classroomId: string;
  subjectId: string;
  score: number;
  gradedBy: string;
  date: string;
}

export type AttendanceStatus = "Present" | "Absent" | "Late";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classroomId: string;
  date: string;
  status: AttendanceStatus;
}

export interface Invoice {
  id: string;
  studentId: string;
  amount: number;
  description: string;
  dueDate: string;
  status: "Paid" | "Unpaid";
  createdAt: string;
}

export interface PaymentLog {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  date: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: Role;
  action: string;
}

interface SchoolContextType {
  currentUser: User | null;
  authLoading: boolean;
  users: User[];
  classrooms: Classroom[];
  subjects: Subject[];
  students: StudentProfile[];
  teachers: TeacherProfile[];
  grades: Grade[];
  attendance: AttendanceRecord[];
  invoices: Invoice[];
  payments: PaymentLog[];
  auditLogs: AuditLog[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedChildId: string;
  setSelectedChildId: (id: string) => void;

  // Auth actions
  login: (email: string) => boolean;
  logout: () => void;
  switchRole: (role: Role) => void;

  // Admin actions
  addStudent: (name: string, email: string, classroomId: string, parentEmail?: string) => void;
  addTeacher: (name: string, email: string, subjectId: string) => void;
  addClassroom: (name: string, subjectIds: string[]) => void;
  createInvoice: (studentId: string, amount: number, description: string) => void;

  // Teacher actions
  recordGrade: (studentId: string, classroomId: string, subjectId: string, score: number) => void;
  recordAttendance: (classroomId: string, date: string, records: { studentId: string; status: AttendanceStatus }[]) => void;

  // Student/Parent actions
  payInvoice: (invoiceId: string, paymentMethod: string) => void;

  // Reset helper
  resetDatabase: () => void;
  updateUserPassword: (email: string, password: string) => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

interface DbUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

function mapDbUserToUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role as Role,
  };
}

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState("");

  // Derive activeTab from pathname
  const activeTab = (() => {
    if (!pathname) return "overview";
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length <= 2) return "overview"; // /dashboard/admin -> "overview"
    return segments[segments.length - 1]; // /dashboard/admin/accounts -> "accounts"
  })();

  const setActiveTab = useCallback((tab: string) => {
    if (!pathname) return;
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length >= 2) {
      const role = segments[1]; // admin, teacher, student, parent, super-admin
      if (tab === "overview") {
        router.push(`/dashboard/${role}`);
      } else {
        router.push(`/dashboard/${role}/${tab}`);
      }
    }
  }, [pathname, router]);

  // Listen for better-auth session changes reactively
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;

    if (session?.user) {
      const userObj: User = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user as { role?: string }).role as Role,
      };
      // Use requestAnimationFrame or microtask to ensure state updates don't conflict
      queueMicrotask(() => {
        setCurrentUser(userObj);
        setAuthLoading(false);
      });
    } else {
      queueMicrotask(() => {
        setCurrentUser(null);
        setAuthLoading(false);
      });
    }
  }, [session, isPending]);

  const logout = async () => {
    await authClient.signOut();
    setCurrentUser(null);
    setSelectedChildId("");
    router.push("/");
  };

  // Note: switchRole is mostly for demo/dev purposes in this context
  const switchRole = (role: Role) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, role });
      router.push(`/dashboard/${role}`);
    }
  };

  const resetDatabase = () => {
    fetch("/api/auth/reset-password/send-otp", { method: "POST", body: "{}" }).catch(() => {});
    window.location.reload();
  };

  return (
    <SchoolContext.Provider
      value={{
        currentUser,
        authLoading,
        activeTab,
        setActiveTab,
        selectedChildId,
        setSelectedChildId,
        logout,
        switchRole,
        resetDatabase,
        // The following are placeholders to prevent breaking existing components immediately
        // but they should be replaced by useQuery hooks in components
        users: [],
        classrooms: [],
        subjects: [],
        students: [],
        teachers: [],
        grades: [],
        attendance: [],
        invoices: [],
        payments: [],
        auditLogs: [],
        login: () => true,
        addStudent: () => {},
        addTeacher: () => {},
        addClassroom: () => {},
        createInvoice: () => {},
        recordGrade: () => {},
        recordAttendance: () => {},
        payInvoice: () => {},
        updateUserPassword: () => {},
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};


export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error("useSchool must be used within a SchoolProvider");
  }
  return context;
};
