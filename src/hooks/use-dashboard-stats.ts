"use client";

import { useQuery } from "@tanstack/react-query";
import * as dashboardActions from "@/server-actions/dashboard";

export function useMonthlyRevenue(role: string, userId: string) {
  return useQuery({
    queryKey: ["dashboard", "revenue", role, userId],
    queryFn: () => dashboardActions.getMonthlyRevenue(role, userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDashboardStats(role: string, userId: string) {
  return useQuery({
    queryKey: ["dashboard", "stats", role, userId],
    queryFn: () => dashboardActions.getDashboardStats(role, userId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useWeeklyReservations(role: string, userId: string) {
  return useQuery({
    queryKey: ["dashboard", "weeklyReservations", role, userId],
    queryFn: () => dashboardActions.getWeeklyReservations(role, userId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useClassroomDistribution(role: string, userId: string) {
  return useQuery({
    queryKey: ["dashboard", "classroomDistribution", role, userId],
    queryFn: () => dashboardActions.getClassroomDistribution(role, userId),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePaymentStatus(role: string, userId: string) {
  return useQuery({
    queryKey: ["dashboard", "paymentStatus", role, userId],
    queryFn: () => dashboardActions.getPaymentStatus(role, userId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopContributingStudents(role: string, userId: string) {
  return useQuery({
    queryKey: ["dashboard", "topContributingStudents", role, userId],
    queryFn: () => dashboardActions.getTopContributingStudents(role, userId),
    staleTime: 5 * 60 * 1000,
  });
}
