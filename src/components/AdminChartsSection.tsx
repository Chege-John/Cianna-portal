"use client";

import React, { useState, useEffect } from "react";
import { ChartSkeleton, PieChartSkeleton } from "@/components/ui/Skeletons";
import DashboardChart from "@/components/DashboardChart";
import { RoundedPieChart } from "@/components/RoundedPieChart";
import WeeklyReservationsChartSyncfusion from "@/components/WeeklyReservationsChartSyncfusion";
import QuickActions from "@/components/QuickActions";
import { FiHome } from "react-icons/fi";
import {
  getMonthlyRevenue,
  getDashboardStats,
  getWeeklyReservations,
  getPropertyTypes,
  getPaymentStatus,
  getTopApartments,
  type LineChartData,
  type WeeklyReservationsData,
} from "@/server-actions/dashboard";

interface AdminChartsSectionProps {
  currentUser: {
    id: string;
    role: string;
    name: string;
    email: string;
  };
}

interface ChartItem {
  label: string;
  value: number;
}

interface ApartmentItem {
  name: string;
  revenue: number;
}

export default function AdminChartsSection({ currentUser }: AdminChartsSectionProps) {
  const [revenueData, setRevenueData] = useState<LineChartData[]>([]);
  const [userDistData, setUserDistData] = useState<ChartItem[]>([]);
  const [weeklyResData, setWeeklyResData] = useState<WeeklyReservationsData>({ data: [], total: 0 });
  const [propertyTypesData, setPropertyTypesData] = useState<ChartItem[]>([]);
  const [paymentStatusData, setPaymentStatusData] = useState<ChartItem[]>([]);
  const [topApartmentsData, setTopApartmentsData] = useState<ApartmentItem[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);

  useEffect(() => {
    async function fetchChartData() {
      try {
        setChartsLoading(true);
        const role = currentUser?.role || "super_admin";
        const userId = currentUser?.id || "";

        const [rev, dist, weekly, prop, pay, top] = await Promise.all([
          getMonthlyRevenue(role, userId),
          getDashboardStats(role, userId),
          getWeeklyReservations(role, userId),
          getPropertyTypes(role, userId),
          getPaymentStatus(role, userId),
          getTopApartments(role, userId),
        ]);

        setRevenueData(rev);
        
        const mappedDist = dist.userDistribution.map((item) => ({
          label: item.role
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l: string) => l.toUpperCase()),
          value: item._count.role,
        }));
        setUserDistData(mappedDist);

        setWeeklyResData(weekly);
        setPropertyTypesData(prop);
        setPaymentStatusData(pay);
        setTopApartmentsData(top);
      } catch (error) {
        console.error("Failed to load chart data:", error);
      } finally {
        setChartsLoading(false);
      }
    }

    if (currentUser) {
      fetchChartData();
    }
  }, [currentUser]);

  // Determine which cards/insights to show based on user role
  const showRevenue = true;
  const showUserDistribution = currentUser?.role === "super-admin" || currentUser?.role === "super_admin";
  const showPaymentInsights = true;
  const showTopApartments = true;

  return (
    <div className="space-y-6 w-full">
      {/* Revenue trend + (for staff managers) role distribution */}
      {(showRevenue || showUserDistribution) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {showRevenue && (
            <div className={showUserDistribution ? "lg:col-span-2" : "lg:col-span-3"}>
              {chartsLoading ? (
                <ChartSkeleton height="400px" />
              ) : (
                <DashboardChart data={revenueData} />
              )}
            </div>
          )}

          {showUserDistribution && (
            <div className={showRevenue ? "lg:col-span-1" : "lg:col-span-3"}>
              {chartsLoading ? (
                <PieChartSkeleton />
              ) : (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      User Distribution
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Breakdown of users by role
                    </p>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <RoundedPieChart data={userDistData} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Weekly reservations + property-type mix (everyone) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {chartsLoading ? (
            <ChartSkeleton height="400px" />
          ) : (
            <WeeklyReservationsChartSyncfusion data={weeklyResData.data} total={weeklyResData.total} />
          )}
        </div>

        <div className="lg:col-span-1">
          {chartsLoading ? (
            <ChartSkeleton height="400px" />
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Property-Type Mix
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Distribution by property type
                </p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <RoundedPieChart data={propertyTypesData} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment-status mix + top apartments (revenue-facing roles) */}
      {showPaymentInsights && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            {chartsLoading ? (
              <PieChartSkeleton />
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Payment Status Mix
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Breakdown of payments by status
                  </p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <RoundedPieChart data={paymentStatusData} />
                </div>
              </div>
            )}
          </div>
          {showTopApartments && (
            <div className="lg:col-span-2">
              {chartsLoading ? (
                <ChartSkeleton height="400px" />
              ) : (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Top Apartments
                    </h3>
                    <p className="text-sm text-gray-500">
                      Highest revenue generating units
                    </p>
                  </div>

                  <div className="space-y-5">
                    {topApartmentsData.map((apt, index) => {
                      const maxRevenue = Math.max(...topApartmentsData.map((a: ApartmentItem) => a.revenue), 1);
                      const pct = (apt.revenue / maxRevenue) * 100;
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 font-medium text-gray-800">
                              <FiHome className="text-gray-400 shrink-0" />
                              <span>{apt.name}</span>
                            </div>
                            <span className="font-semibold text-gray-900">
                              KSh {apt.revenue.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions Component on its own row */}
      <div>
        <QuickActions title="Quick Actions" role={currentUser?.role || "super-admin"} />
      </div>
    </div>
  );
}
