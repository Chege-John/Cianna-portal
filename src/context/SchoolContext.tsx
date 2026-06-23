"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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
  subjectId: string; // Specialization
}

export interface Classroom {
  id: string;
  name: string; // e.g. "Deutsch A1 - Intensiv", "Deutsch B2 - Abendkurs"
  teacherId?: string;
  subjectIds: string[];
}

export interface Subject {
  id: string;
  name: string; // e.g. "Grammatik", "Konversation", "Schreiben"
}

export interface Grade {
  id: string;
  studentId: string;
  classroomId: string;
  subjectId: string;
  score: number; // 0 - 100
  gradedBy: string; // Teacher name
  date: string;
}

export type AttendanceStatus = "Present" | "Absent" | "Late";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classroomId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
}

export interface Invoice {
  id: string;
  studentId: string;
  amount: number;
  description: string; // e.g. "Kursgebühr A1", "Lehrbücher"
  dueDate: string;
  status: "Paid" | "Unpaid";
  createdAt: string;
}

export interface PaymentLog {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string; // e.g. "Kreditkarte", "Banküberweisung"
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

// Initial Mock Data
const initialUsers: User[] = [
  { id: "u-1", name: "Herr Müller", email: "mueller@cianna.de", role: "super-admin" },
  { id: "u-2", name: "Frau Schmidt", email: "schmidt@cianna.de", role: "admin" },
  { id: "u-3", name: "Herr Weber (Deutsch-A1)", email: "weber@cianna.de", role: "teacher" },
  { id: "u-4", name: "Frau Wagner (Deutsch-B2)", email: "wagner@cianna.de", role: "teacher" },
  { id: "u-5", name: "Lukas Meier", email: "lukas@student.de", role: "student" },
  { id: "u-6", name: "Sofia Becker", email: "sofia@student.de", role: "student" },
  { id: "u-7", name: "Maria Meier", email: "maria@parent.de", role: "parent" },
  { id: "u-8", name: "John Irungu Chege", email: "johnirunguchege2000@gmail.com", role: "super-admin" }
];

const initialSubjects: Subject[] = [
  { id: "s-1", name: "Grammatik & Wortschatz" },
  { id: "s-2", name: "Konversation & Aussprache" },
  { id: "s-3", name: "Schreiben & Hören" }
];

const initialClassrooms: Classroom[] = [
  { id: "c-1", name: "Deutsch A1 - Intensiv", teacherId: "u-3", subjectIds: ["s-1", "s-3"] },
  { id: "c-2", name: "Deutsch B2 - Abendkurs", teacherId: "u-4", subjectIds: ["s-1", "s-2", "s-3"] }
];

const initialStudents: StudentProfile[] = [
  { id: "u-5", name: "Lukas Meier", email: "lukas@student.de", classroomId: "c-1", parentEmail: "maria@parent.de" },
  { id: "u-6", name: "Sofia Becker", email: "sofia@student.de", classroomId: "c-2" }
];

const initialTeachers: TeacherProfile[] = [
  { id: "u-3", name: "Herr Weber", email: "weber@cianna.de", subjectId: "s-1" },
  { id: "u-4", name: "Frau Wagner", email: "wagner@cianna.de", subjectId: "s-2" }
];

const initialGrades: Grade[] = [
  { id: "g-1", studentId: "u-5", classroomId: "c-1", subjectId: "s-1", score: 85, gradedBy: "Herr Weber", date: "2026-06-15" },
  { id: "g-2", studentId: "u-6", classroomId: "c-2", subjectId: "s-1", score: 92, gradedBy: "Frau Wagner", date: "2026-06-16" },
  { id: "g-3", studentId: "u-6", classroomId: "c-2", subjectId: "s-2", score: 95, gradedBy: "Frau Wagner", date: "2026-06-18" }
];

const initialAttendance: AttendanceRecord[] = [
  { id: "a-1", studentId: "u-5", classroomId: "c-1", date: "2026-06-20", status: "Present" },
  { id: "a-2", studentId: "u-5", classroomId: "c-1", date: "2026-06-21", status: "Late" },
  { id: "a-3", studentId: "u-6", classroomId: "c-2", date: "2026-06-20", status: "Present" },
  { id: "a-4", studentId: "u-6", classroomId: "c-2", date: "2026-06-21", status: "Present" }
];

const initialInvoices: Invoice[] = [
  { id: "inv-1", studentId: "u-5", amount: 350.00, description: "Kursgebühr A1 - Intensiv (Monat Juni)", dueDate: "2026-07-05", status: "Unpaid", createdAt: "2026-06-15" },
  { id: "inv-2", studentId: "u-5", amount: 45.00, description: "Lehrmaterialien A1 (Schritte International)", dueDate: "2026-06-25", status: "Paid", createdAt: "2026-06-10" },
  { id: "inv-3", studentId: "u-6", amount: 480.00, description: "Kursgebühr B2 - Abendkurs (Monat Juni)", dueDate: "2026-06-30", status: "Paid", createdAt: "2026-06-10" }
];

const initialPayments: PaymentLog[] = [
  { id: "p-1", invoiceId: "inv-2", amount: 45.00, paymentMethod: "Kreditkarte", date: "2026-06-12" },
  { id: "p-2", invoiceId: "inv-3", amount: 480.00, paymentMethod: "Banküberweisung", date: "2026-06-14" }
];

const initialAuditLogs: AuditLog[] = [
  { id: "l-1", timestamp: "2026-06-10T09:00:00Z", actor: "Herr Müller", role: "super-admin", action: "Cianna Portal initialisiert." },
  { id: "l-2", timestamp: "2026-06-10T10:15:00Z", actor: "Frau Schmidt", role: "admin", action: "Klassenräume Deutsch A1 und B2 eingerichtet." },
  { id: "l-3", timestamp: "2026-06-15T14:30:00Z", actor: "Herr Weber", role: "teacher", action: "Noten für Lukas Meier in Grammatik eingetragen." }
];

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
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
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Load from local storage
  useEffect(() => {
    const getLocal = <T,>(key: string, initial: T): T => {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    };

    const loadedUsers = getLocal<User[]>("school_users", initialUsers);
    // Ensure the new super-admin profile is always injected even if they have old local storage users!
    const hasJohn = loadedUsers.some(u => u.email.toLowerCase() === "johnirunguchege2000@gmail.com");
    if (!hasJohn) {
      const updatedUsers: User[] = [
        ...loadedUsers,
        { id: "u-8", name: "John Irungu Chege", email: "johnirunguchege2000@gmail.com", role: "super-admin" }
      ];
      localStorage.setItem("school_users", JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
    } else {
      setUsers(loadedUsers);
    }

    setSubjects(getLocal("school_subjects", initialSubjects));
    setClassrooms(getLocal("school_classrooms", initialClassrooms));
    setStudents(getLocal("school_students", initialStudents));
    setTeachers(getLocal("school_teachers", initialTeachers));
    setGrades(getLocal("school_grades", initialGrades));
    setAttendance(getLocal("school_attendance", initialAttendance));
    setInvoices(getLocal("school_invoices", initialInvoices));
    setPayments(getLocal("school_payments", initialPayments));
    setAuditLogs(getLocal("school_audit", initialAuditLogs));

    const storedUser = localStorage.getItem("school_current_user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    } else {
      setCurrentUser(null);
    }
    setAuthLoading(false);
  }, []);

  // Save changes helper
  const syncStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const addLog = (action: string, actorName?: string, actorRole?: Role) => {
    const name = actorName || currentUser?.name || "System";
    const role = actorRole || currentUser?.role || "super-admin";
    const newLog: AuditLog = {
      id: `l-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: name,
      role,
      action
    };
    setAuditLogs(prev => {
      const updated = [newLog, ...prev];
      syncStorage("school_audit", updated);
      return updated;
    });
  };

  // Auth Operations
  const login = (email: string): boolean => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      setActiveTab("overview");
      syncStorage("school_current_user", user);
      addLog(`Eingeloggt als ${user.name} (${user.role})`, user.name, user.role);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      addLog(`Ausgeloggt`, currentUser.name, currentUser.role);
    }
    setCurrentUser(null);
    setActiveTab("overview");
    localStorage.removeItem("school_current_user");
  };

  const switchRole = (role: Role) => {
    const userWithRole = users.find(u => u.role === role);
    if (userWithRole) {
      setCurrentUser(userWithRole);
      setActiveTab("overview");
      syncStorage("school_current_user", userWithRole);
      addLog(`Rolle gewechselt zu: ${userWithRole.name} (${role})`, userWithRole.name, userWithRole.role);
    }
  };

  // Admin Actions
  const addStudent = (name: string, email: string, classroomId: string, parentEmail?: string) => {
    const studentId = `u-${Date.now()}`;
    const newUser: User = { id: studentId, name, email, role: "student" };
    const newProfile: StudentProfile = { id: studentId, name, email, classroomId, parentEmail };

    const updatedUsers = [...users, newUser];
    const updatedStudents = [...students, newProfile];

    setUsers(updatedUsers);
    setStudents(updatedStudents);

    syncStorage("school_users", updatedUsers);
    syncStorage("school_students", updatedStudents);

    addLog(`Schüler registriert: ${name} (${email})`);
  };

  const addTeacher = (name: string, email: string, subjectId: string) => {
    const teacherId = `u-${Date.now()}`;
    const newUser: User = { id: teacherId, name, email, role: "teacher" };
    const newProfile: TeacherProfile = { id: teacherId, name, email, subjectId };

    const updatedUsers = [...users, newUser];
    const updatedTeachers = [...teachers, newProfile];

    setUsers(updatedUsers);
    setTeachers(updatedTeachers);

    syncStorage("school_users", updatedUsers);
    syncStorage("school_teachers", updatedTeachers);

    addLog(`Lehrkraft registriert: ${name} (${email})`);
  };

  const addClassroom = (name: string, subjectIds: string[]) => {
    const newClass: Classroom = {
      id: `c-${Date.now()}`,
      name,
      subjectIds
    };
    const updated = [...classrooms, newClass];
    setClassrooms(updated);
    syncStorage("school_classrooms", updated);
    addLog(`Klassenraum erstellt: ${name}`);
  };

  const createInvoice = (studentId: string, amount: number, description: string) => {
    const student = students.find(s => s.id === studentId);
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      studentId,
      amount,
      description,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 14 days due
      status: "Unpaid",
      createdAt: new Date().toISOString().split("T")[0]
    };
    const updated = [newInvoice, ...invoices];
    setInvoices(updated);
    syncStorage("school_invoices", updated);
    addLog(`Rechnung erstellt für ${student?.name || studentId}: ${amount} EUR - ${description}`);
  };

  // Teacher Actions
  const recordGrade = (studentId: string, classroomId: string, subjectId: string, score: number) => {
    const student = students.find(s => s.id === studentId);
    const subject = subjects.find(s => s.id === subjectId);
    const newGrade: Grade = {
      id: `g-${Date.now()}`,
      studentId,
      classroomId,
      subjectId,
      score,
      gradedBy: currentUser?.name || "Lehrkraft",
      date: new Date().toISOString().split("T")[0]
    };
    const updated = [newGrade, ...grades];
    setGrades(updated);
    syncStorage("school_grades", updated);
    addLog(`Note eingetragen für ${student?.name} in ${subject?.name}: ${score}%`);
  };

  const recordAttendance = (classroomId: string, date: string, records: { studentId: string; status: AttendanceStatus }[]) => {
    const room = classrooms.find(c => c.id === classroomId);
    const newRecords: AttendanceRecord[] = records.map((r, index) => ({
      id: `a-${Date.now()}-${index}`,
      studentId: r.studentId,
      classroomId,
      date,
      status: r.status
    }));

    // Filter out existing records for this class and date
    setAttendance(prev => {
      const filtered = prev.filter(a => !(a.classroomId === classroomId && a.date === date));
      const updated = [...filtered, ...newRecords];
      syncStorage("school_attendance", updated);
      return updated;
    });

    addLog(`Anwesenheit protokolliert für ${room?.name} am ${date}`);
  };

  // Student/Parent Actions
  const payInvoice = (invoiceId: string, paymentMethod: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    // Update Invoice Status
    const updatedInvoices = invoices.map(inv => {
      if (inv.id === invoiceId) {
        return { ...inv, status: "Paid" as const };
      }
      return inv;
    });
    setInvoices(updatedInvoices);
    syncStorage("school_invoices", updatedInvoices);

    // Record Payment Log
    const newPayment: PaymentLog = {
      id: `p-${Date.now()}`,
      invoiceId,
      amount: invoice.amount,
      paymentMethod,
      date: new Date().toISOString().split("T")[0]
    };
    const updatedPayments = [newPayment, ...payments];
    setPayments(updatedPayments);
    syncStorage("school_payments", updatedPayments);

    const student = students.find(s => s.id === invoice.studentId);
    addLog(`Rechnung bezahlt: ${invoice.amount} EUR von ${student?.name} via ${paymentMethod}`);
  };

  // Reset database helper
  const resetDatabase = () => {
    localStorage.removeItem("school_users");
    localStorage.removeItem("school_subjects");
    localStorage.removeItem("school_classrooms");
    localStorage.removeItem("school_students");
    localStorage.removeItem("school_teachers");
    localStorage.removeItem("school_grades");
    localStorage.removeItem("school_attendance");
    localStorage.removeItem("school_invoices");
    localStorage.removeItem("school_payments");
    localStorage.removeItem("school_audit");
    localStorage.removeItem("school_current_user");

    setUsers(initialUsers);
    setSubjects(initialSubjects);
    setClassrooms(initialClassrooms);
    setStudents(initialStudents);
    setTeachers(initialTeachers);
    setGrades(initialGrades);
    setAttendance(initialAttendance);
    setInvoices(initialInvoices);
    setPayments(initialPayments);
    setAuditLogs(initialAuditLogs);
    setCurrentUser(initialUsers[0]);
    
    localStorage.setItem("school_current_user", JSON.stringify(initialUsers[0]));
    
    addLog(`Datenbank auf Standardwerte zurückgesetzt.`);
  };

  const updateUserPassword = (email: string, password: string) => {
    const updatedUsers = users.map(u => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return { ...u, password };
      }
      return u;
    });
    setUsers(updatedUsers);
    syncStorage("school_users", updatedUsers);
    addLog(`Passwort zurückgesetzt für Benutzer: ${email}`, "System", "super-admin");
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
        updateUserPassword
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
