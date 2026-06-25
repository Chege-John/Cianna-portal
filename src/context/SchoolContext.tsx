"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  const loadAllData = useCallback(async () => {
    const [
      dbUsers,
      dbSubjects,
      dbClassrooms,
      dbClassroomSubjects,
      dbStudents,
      dbTeachers,
      dbGrades,
      dbAttendance,
      dbInvoices,
      dbPayments,
      dbAuditLogs,
    ] = await Promise.all([
      getUsers(),
      getSubjects(),
      getClassrooms(),
      getClassroomSubjects(),
      getStudents(),
      getTeachers(),
      getGrades(),
      getAttendance(),
      getInvoices(),
      getPayments(),
      getAuditLogs(),
    ]);

    setUsers(dbUsers.map(mapDbUserToUser));
    setSubjects(dbSubjects);
    setClassrooms(
      dbClassrooms.map((c) => ({
        id: c.id,
        name: c.name,
        teacherId: c.teacherId || undefined,
        subjectIds: dbClassroomSubjects
          .filter((cs) => cs.classroomId === c.id)
          .map((cs) => cs.subjectId),
      }))
    );
    setStudents(
      dbStudents.map((s) => ({
        id: s.id,
        name: dbUsers.find((u) => u.id === s.id)?.name || "",
        email: dbUsers.find((u) => u.id === s.id)?.email || "",
        classroomId: s.classroomId || "",
        parentEmail: s.parentEmail || undefined,
      }))
    );
    setTeachers(
      dbTeachers.map((t) => ({
        id: t.id,
        name: dbUsers.find((u) => u.id === t.id)?.name || "",
        email: dbUsers.find((u) => u.id === t.id)?.email || "",
        subjectId: t.subjectId || "",
      }))
    );
    setGrades(dbGrades);
    setAttendance(dbAttendance);
    setInvoices(
      dbInvoices.map((inv) => ({
        ...inv,
        amount: Number(inv.amount),
      }))
    );
    setPayments(
      dbPayments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      }))
    );
    setAuditLogs(dbAuditLogs);
  }, []);

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
      setTimeout(() => {
        setCurrentUser(userObj);
        loadAllData();
      }, 0);
    } else {
      setTimeout(() => {
        setCurrentUser(null);
      }, 0);
    }
    setTimeout(() => {
      setAuthLoading(false);
    }, 0);
  }, [session, isPending, loadAllData]);

  const login = (_email: string): boolean => {
    void _email;
    return true;
  };

  const logout = async () => {
    await authClient.signOut();
    setCurrentUser(null);
    setActiveTab("overview");
  };

  const switchRole = async (role: Role) => {
    const user = users.find((u) => u.role === role);
    if (user) {
      setCurrentUser(user);
      setActiveTab("overview");
    }
  };

  // Admin Actions
  const addStudent = async (name: string, email: string, classroomId: string, parentEmail?: string) => {
    await addStudentAction(name, email, classroomId, parentEmail);
    await loadAllData();
  };

  const addTeacher = async (name: string, email: string, subjectId: string) => {
    await addTeacherAction(name, email, subjectId);
    await loadAllData();
  };

  const addClassroom = async (name: string, subjectIds: string[]) => {
    await addClassroomAction(name, subjectIds);
    await loadAllData();
  };

  const createInvoice = async (studentId: string, amount: number, description: string) => {
    await createInvoiceAction(studentId, amount, description);
    await loadAllData();
  };

  // Teacher Actions
  const recordGrade = async (studentId: string, classroomId: string, subjectId: string, score: number) => {
    await recordGradeAction(studentId, classroomId, subjectId, score, currentUser?.name || "Lehrkraft");
    await loadAllData();
  };

  const recordAttendance = async (classroomId: string, date: string, records: { studentId: string; status: AttendanceStatus }[]) => {
    await recordAttendanceAction(classroomId, date, records);
    await loadAllData();
  };

  // Student/Parent Actions
  const payInvoice = async (invoiceId: string, paymentMethod: string) => {
    await payInvoiceAction(invoiceId, paymentMethod);
    await loadAllData();
  };

  const resetDatabase = () => {
    // Redirect to seed via API or show toast
    fetch("/api/auth/reset-password/send-otp", { method: "POST", body: "{}" }).catch(() => {});
    window.location.reload();
  };

  const updateUserPassword = (_email: string, _password: string) => {
    void _email;
    void _password;
    // Password update is handled server-side via verify-otp route
  };

  return (
    <SchoolContext.Provider
      value={{
        currentUser,
        authLoading,
        users,
        classrooms,
        subjects,
        students,
        teachers,
        grades,
        attendance,
        invoices,
        payments,
        auditLogs,
        activeTab,
        setActiveTab,
        login,
        logout,
        switchRole,
        addStudent,
        addTeacher,
        addClassroom,
        createInvoice,
        recordGrade,
        recordAttendance,
        payInvoice,
        resetDatabase,
        updateUserPassword,
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
