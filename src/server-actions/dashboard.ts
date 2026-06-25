"use server";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";

export interface LineChartData {
  month: string;
  revenue: number;
}

export interface UserDistributionItem {
  role: string;
  _count: {
    role: number;
  };
}

export interface WeeklyReservationsData {
  data: { name: string; amount: number }[];
  total: number;
}

export async function getMonthlyRevenue(
  _role: string,
  _userId: string,
  _managedCounties: string[] = []
): Promise<LineChartData[]> {
  void _role;
  void _userId;
  void _managedCounties;
  const rows = await db
    .select({
      month: sql<string>`to_char(${schema.invoice.createdAt}::date, 'Mon')`,
      revenue: sql<number>`COALESCE(SUM(${schema.invoice.amount}), 0)`,
    })
    .from(schema.invoice)
    .groupBy(sql`to_char(${schema.invoice.createdAt}::date, 'Mon')`)
    .orderBy(sql`MIN(${schema.invoice.createdAt}::date)`);

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const revenueMap = new Map(rows.map(r => [r.month, Number(r.revenue)]));

  return months.map(month => ({
    month,
    revenue: revenueMap.get(month) || 0,
  }));
}

export async function getDashboardStats(
  _role: string,
  _userId: string,
  _managedCounties: string[] = []
): Promise<{ userDistribution: UserDistributionItem[] }> {
  void _role;
  void _userId;
  void _managedCounties;
  const rows = await db
    .select({
      role: schema.user.role,
      _count: sql<number>`COUNT(*)`,
    })
    .from(schema.user)
    .groupBy(schema.user.role);

  return {
    userDistribution: rows.map(r => ({
      role: r.role,
      _count: { role: Number(r._count) },
    })),
  };
}

export async function getWeeklyReservations(
  _role: string,
  _userId: string,
  _managedCounties: string[] = []
): Promise<WeeklyReservationsData> {
  void _role;
  void _userId;
  void _managedCounties;
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const rows = await db
    .select({
      dayOfWeek: sql<string>`to_char(${schema.attendanceRecord.date}::date, 'Dy')`,
      count: sql<number>`COUNT(*)`,
    })
    .from(schema.attendanceRecord)
    .groupBy(sql`to_char(${schema.attendanceRecord.date}::date, 'Dy')`);

  const countMap = new Map(rows.map(r => [r.dayOfWeek, Number(r.count)]));
  const data = days.map(name => ({
    name,
    amount: countMap.get(name) || 0,
  }));
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return { data, total };
}

export async function getPropertyTypes(
  _role: string,
  _userId: string,
  _managedCounties: string[] = []
) {
  void _role;
  void _userId;
  void _managedCounties;
  const rows = await db
    .select({
      name: schema.classroom.name,
      studentCount: sql<number>`(
        SELECT COUNT(*) FROM ${schema.studentProfile}
        WHERE ${schema.studentProfile.classroomId} = ${schema.classroom.id}
      )`,
    })
    .from(schema.classroom);

  return rows.map(r => ({
    label: r.name,
    value: Number(r.studentCount),
  }));
}

export async function getPaymentStatus(
  _role: string,
  _userId: string,
  _managedCounties: string[] = []
) {
  void _role;
  void _userId;
  void _managedCounties;
  const rows = await db
    .select({
      status: schema.invoice.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(schema.invoice)
    .groupBy(schema.invoice.status);

  return rows.map(r => ({
    label: r.status,
    value: Number(r.count),
  }));
}

export async function getTopApartments(
  _role: string,
  _userId: string,
  _managedCounties: string[] = []
) {
  void _role;
  void _userId;
  void _managedCounties;
  const rows = await db
    .select({
      name: schema.user.name,
      revenue: sql<number>`COALESCE(SUM(${schema.invoice.amount}), 0)`,
    })
    .from(schema.invoice)
    .innerJoin(schema.user, eq(schema.invoice.studentId, schema.user.id))
    .groupBy(schema.user.name, schema.user.id)
    .orderBy(sql`COALESCE(SUM(${schema.invoice.amount}), 0) DESC`)
    .limit(5);

  return rows.map(r => ({
    name: r.name,
    revenue: Number(r.revenue),
  }));
}
