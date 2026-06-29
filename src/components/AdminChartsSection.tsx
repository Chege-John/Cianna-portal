"use client";

import { 
  useMonthlyRevenue, 
  useDashboardStats, 
  useWeeklyReservations, 
  useClassroomDistribution, 
  usePaymentStatus, 
  useTopContributingStudents 
} from "@/hooks/use-dashboard-stats";
import DashboardChart from "@/components/DashboardChart";
import { RoundedPieChart } from "@/components/RoundedPieChart";
import WeeklyReservationsChartSyncfusion from "@/components/WeeklyReservationsChartSyncfusion";
import { FiUsers } from "react-icons/fi";
import QuickActions from "@/components/QuickActions";

interface AdminChartsSectionProps {
  currentUser: {
    id: string;
    role: string;
    name: string;
    email: string;
  };
  setActiveTab?: (tab: string) => void;
}

interface StudentContributionItem {
  name: string;
  revenue: number;
}

export default function AdminChartsSection({ currentUser, setActiveTab }: AdminChartsSectionProps) {
  const role = currentUser?.role || "admin";
  const userId = currentUser?.id || "";

  const { data: revenueData = [], isLoading: revenueLoading } = useMonthlyRevenue(role, userId);
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats(role, userId);
  const { data: weeklyResData = { data: [], total: 0 }, isLoading: weeklyLoading } = useWeeklyReservations(role, userId);
  const { data: classroomDistData = [], isLoading: classroomLoading } = useClassroomDistribution(role, userId);
  const { data: paymentStatusData = [], isLoading: paymentLoading } = usePaymentStatus(role, userId);
  const { data: topStudentsData = [], isLoading: topLoading } = useTopContributingStudents(role, userId);

  const chartsLoading = revenueLoading || statsLoading || weeklyLoading || classroomLoading || paymentLoading || topLoading;

  const userDistData = dashboardStats?.userDistribution.map((item) => ({
    label: item.role
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l: string) => l.toUpperCase()),
    value: item._count.role,
  })) || [];

  const showUserDistribution = currentUser?.role === "super-admin";
  const showTopStudents = true;

  if (chartsLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-slate-50 dark:bg-slate-850 h-[300px] rounded-2xl border border-slate-100 dark:border-slate-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Revenue trend + User distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={showUserDistribution ? "lg:col-span-2" : "lg:col-span-3"}>
            <DashboardChart data={revenueData} />
        </div>

        {showUserDistribution && (
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">User Role Distribution</h3>
              <p className="text-xs text-slate-400 mb-4">Breakdown of administrative and learner accounts.</p>
              <div className="flex-1 flex items-center justify-center">
                <RoundedPieChart data={userDistData} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Attendance + Classroom Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <WeeklyReservationsChartSyncfusion data={weeklyResData.data} total={weeklyResData.total} />
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full">
            <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">Learner Cohort Distribution</h3>
            <p className="text-xs text-slate-400 mb-4">Students enrolled per language classroom.</p>
            <div className="flex-1 flex items-center justify-center">
              <RoundedPieChart data={classroomDistData} />
            </div>
          </div>
        </div>
      </div>

      {/* Payment-status + Top Contributing Students */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full">
            <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">Invoice Status Mix</h3>
            <p className="text-xs text-slate-400 mb-4">Status of tuition bills across the institute.</p>
            <div className="flex-1 flex items-center justify-center">
              <RoundedPieChart data={paymentStatusData} />
            </div>
          </div>
        </div>

        {showTopStudents && (
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 h-full">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">Top Contributing Students</h3>
                <p className="text-xs text-slate-400">Highest tuition revenue generated per learner.</p>
              </div>

              <div className="space-y-5">
                {topStudentsData.map((student, index) => {
                  const maxRevenue = Math.max(...topStudentsData.map((s: StudentContributionItem) => s.revenue), 1);
                  const pct = (student.revenue / maxRevenue) * 100;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                          <FiUsers className="text-slate-400 shrink-0" />
                          <span>{student.name}</span>
                        </div>
                        <span className="font-bold text-[#256ff1]">
                          {student.revenue.toLocaleString()} KSh
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#256ff1] h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions Component on its own row */}
      <div>
        <QuickActions title="Quick Actions" role={currentUser?.role || "admin"} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}
