"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as schoolActions from "@/server-actions/school";

// ==========================================
// 1. SYSTEM USER HOOKS
// ==========================================

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => schoolActions.getUsers(),
  });
}

// ==========================================
// 2. ACADEMIC DATA HOOKS
// ==========================================

export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const dbStudents = await schoolActions.getStudents();
      const dbUsers = await schoolActions.getUsers();
      
      // Merge user data into profile for UI convenience
      return dbStudents.map((s) => ({
        id: s.id,
        name: dbUsers.find((u) => u.id === s.id)?.name || "Unknown",
        email: dbUsers.find((u) => u.id === s.id)?.email || "",
        classroomId: s.classroomId || "",
        parentEmail: s.parentEmail || undefined,
      }));
    },
  });
}

export function useTeachers() {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const dbTeachers = await schoolActions.getTeachers();
      const dbUsers = await schoolActions.getUsers();
      
      return dbTeachers.map((t) => ({
        id: t.id,
        name: dbUsers.find((u) => u.id === t.id)?.name || "Unknown",
        email: dbUsers.find((u) => u.id === t.id)?.email || "",
        subjectId: t.subjectId || "",
      }));
    },
  });
}

export function useClassrooms() {
  return useQuery({
    queryKey: ["classrooms"],
    queryFn: async () => {
      const [classrooms, classroomSubjects] = await Promise.all([
        schoolActions.getClassrooms(),
        schoolActions.getClassroomSubjects(),
      ]);

      return classrooms.map((c) => ({
        id: c.id,
        name: c.name,
        teacherId: c.teacherId || undefined,
        subjectIds: classroomSubjects
          .filter((cs) => cs.classroomId === c.id)
          .map((cs) => cs.subjectId),
      }));
    },
  });
}

export function useSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: () => schoolActions.getSubjects(),
  });
}

export function useGrades() {
  return useQuery({
    queryKey: ["grades"],
    queryFn: () => schoolActions.getGrades(),
  });
}

export function useAttendance() {
  return useQuery({
    queryKey: ["attendance"],
    queryFn: () => schoolActions.getAttendance(),
  });
}

// ==========================================
// 2. FINANCIAL DATA HOOKS
// ==========================================

export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const invoices = await schoolActions.getInvoices();
      return invoices.map(inv => ({
        ...inv,
        amount: Number(inv.amount)
      }));
    },
  });
}

export function usePayments() {
  return useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const payments = await schoolActions.getPayments();
      return payments.map(p => ({
        ...p,
        amount: Number(p.amount)
      }));
    },
  });
}

// ==========================================
// 3. MUTATIONS (DATA UPDATES)
// ==========================================

export function useSchoolMutations() {
  const queryClient = useQueryClient();

  const addStudent = useMutation({
    mutationFn: (data: { name: string; email: string; classroomId: string; parentEmail?: string }) =>
      schoolActions.addStudentAction(data.name, data.email, data.classroomId, data.parentEmail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["auditLogs"] });
    },
  });

  const addTeacher = useMutation({
    mutationFn: (data: { name: string; email: string; subjectId: string }) =>
      schoolActions.addTeacherAction(data.name, data.email, data.subjectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["auditLogs"] });
    },
  });

  const createInvoice = useMutation({
    mutationFn: (data: { studentId: string; amount: number; description: string }) =>
      schoolActions.createInvoiceAction(data.studentId, data.amount, data.description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["auditLogs"] });
    },
  });

  const addClassroom = useMutation({
    mutationFn: (data: { name: string; subjectIds: string[] }) =>
      schoolActions.addClassroomAction(data.name, data.subjectIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      queryClient.invalidateQueries({ queryKey: ["auditLogs"] });
    },
  });

  const recordGrade = useMutation({
    mutationFn: (data: { studentId: string; classroomId: string; subjectId: string; score: number; gradedBy: string }) =>
      schoolActions.recordGradeAction(data.studentId, data.classroomId, data.subjectId, data.score, data.gradedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      queryClient.invalidateQueries({ queryKey: ["auditLogs"] });
    },
  });

  const recordAttendance = useMutation({
    mutationFn: (data: { classroomId: string; date: string; records: { studentId: string; status: "Present" | "Absent" | "Late" }[] }) =>
      schoolActions.recordAttendanceAction(data.classroomId, data.date, data.records),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["auditLogs"] });
    },
  });

  const payInvoice = useMutation({
    mutationFn: (data: { invoiceId: string; paymentMethod: string }) =>
      schoolActions.payInvoiceAction(data.invoiceId, data.paymentMethod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["auditLogs"] });
    },
  });

  const updateUser = useMutation({
    mutationFn: (data: { id: string; name: string; email: string; role: "super-admin" | "admin" | "teacher" | "student" | "parent" }) =>
      schoolActions.updateUserAction(data.id, data.name, data.email, data.role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["auditLogs"] });
    },
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => schoolActions.deleteUserAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["auditLogs"] });
    },
  });

  return {
    addStudent,
    addTeacher,
    addClassroom,
    createInvoice,
    recordGrade,
    recordAttendance,
    payInvoice,
    updateUser,
    deleteUser,
  };
}

// ==========================================
// 4. SYSTEM LOGS
// ==========================================

export function useAuditLogs() {
  return useQuery({
    queryKey: ["auditLogs"],
    queryFn: () => schoolActions.getAuditLogs(),
  });
}
