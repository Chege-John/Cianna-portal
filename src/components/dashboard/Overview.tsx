import React, { useState } from "react";
import { useSchool, Invoice } from "@/context/SchoolContext";
import { 
  useStudents, 
  useTeachers, 
  useClassrooms, 
  useSubjects, 
  useInvoices, 
  useGrades, 
  useAttendance 
} from "@/hooks/use-school-data";
import { PageHeader } from "@/components/PageHeader";
import StatsCard from "@/components/StatsCard";
import AdminChartsSection from "@/components/AdminChartsSection";
import { InvoiceModal } from "@/components/InvoiceModal";
import { getPaymentAlerts } from "@/lib/payment-utils";
import { 
  FaEye, 
  FaChalkboardTeacher, 
  FaGraduationCap, 
  FaClock,
  FaExclamationTriangle
} from "react-icons/fa";

interface OverviewProps {
  selectedChildId?: string; // Provided by Parent wrapper
}

export default function Overview({ selectedChildId }: OverviewProps) {
  const { currentUser, setActiveTab } = useSchool();
  
  // Fetching data via granular React Query hooks
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: teachers = [], isLoading: teachersLoading } = useTeachers();
  const { data: classrooms = [], isLoading: classroomsLoading } = useClassrooms();
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: grades = [], isLoading: gradesLoading } = useGrades();
  const { data: attendance = [], isLoading: attendanceLoading } = useAttendance();

  // Invoice Details Modal state for Admin
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const isLoading = 
    studentsLoading || 
    teachersLoading || 
    classroomsLoading || 
    subjectsLoading || 
    invoicesLoading || 
    gradesLoading || 
    attendanceLoading;

  if (!currentUser) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#256ff1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const role = currentUser.role;

  // Helper resolvers
  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || "No Subject";

  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || "Unknown Student";

  // Global Admin calculation metrics
  const totalPaid = invoices.filter(inv => inv.status === "Paid").reduce((sum, inv) => sum + inv.amount, 0);
  const outstanding = invoices.filter(inv => inv.status === "Unpaid").reduce((sum, inv) => sum + inv.amount, 0);

  // -------------------------------------------------------------
  // RENDER: SUPER-ADMIN & ADMIN
  // -------------------------------------------------------------
  if (role === "super-admin" || role === "admin") {
    return (
      <div className="space-y-6 animate-fade-in w-full">
        <PageHeader 
          title="Dashboard Overview" 
          description={
            role === "super-admin" 
              ? "Real-time system operations, performance metrics, and security audit metrics."
              : "Real-time system operations, student enrollment metrics, and outstanding tuition summaries."
          }
        />

        {/* Quick Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Students"
            total={students.length}
            iconName="FiUsers"
            color="text-[#256ff1]"
            description="Actively enrolled learners"
          />
          <StatsCard
            title="Instructors"
            total={teachers.length}
            iconName="FiBriefcase"
            color="text-indigo-500"
            description="Professional lecturers"
          />
          <StatsCard
            title="Collected Fees"
            total={`${totalPaid.toLocaleString()} KSh`}
            iconName="FiDollarSign"
            color="text-emerald-500"
            description="Paid invoices settled"
          />
          <StatsCard
            title="Outstanding"
            total={`${outstanding.toLocaleString()} KSh`}
            iconName="FiAlertCircle"
            color="text-rose-500"
            description="Pending school invoices"
          />
        </div>

        {/* Dynamic Interactive Charts */}
        <AdminChartsSection currentUser={currentUser} setActiveTab={setActiveTab} />

        {/* Payment Installment Alerts */}
        {(role === "super-admin" || role === "admin") && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm shadow-slate-100/10">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-600 rounded-lg">
                <FaExclamationTriangle size={18} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">Payment Installment Alerts</h2>
                <p className="text-xs text-slate-400 mt-0.5">Students who reached the halfway mark but haven&apos;t cleared their balance.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getPaymentAlerts(invoices, students as any).map(alert => (
                <div 
                  key={alert.invoiceId}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:shadow-md ${
                    alert.severity === "high" 
                      ? "bg-rose-50/50 border-rose-100 dark:bg-rose-950/10 dark:border-rose-900/30" 
                      : "bg-amber-50/50 border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/30"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{alert.studentName}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                        alert.severity === "high" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                      }`}>
                        {alert.severity} Priority
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-3">{alert.message}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-black/5 dark:border-white/5">
                    <div className="text-[10px] font-bold text-slate-500">
                      Balance: <span className="text-slate-900 dark:text-slate-100 font-mono">{alert.balance.toLocaleString()} KSh</span>
                    </div>
                    <button 
                      onClick={() => {
                        const inv = invoices.find(i => i.id === alert.invoiceId);
                        if (inv) {
                          setSelectedInvoice(inv);
                          setInvoiceModalOpen(true);
                        }
                      }}
                      className="text-[10px] font-black text-[#256ff1] uppercase tracking-widest hover:underline"
                    >
                      View Invoice
                    </button>
                  </div>
                </div>
              ))}
              {getPaymentAlerts(invoices, students as any).length === 0 && (
                <div className="col-span-full py-6 text-center text-slate-400 font-medium text-sm italic">
                  No active payment installment alerts. All students are within their payment schedules.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Outstanding Invoices List (Only Admin View) */}
        {role === "admin" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm shadow-slate-100/10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">Outstanding Fees & Unpaid Invoices</h2>
                <p className="text-xs text-slate-400 mt-0.5">Summary of pending payments that require attention.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-850/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-850">
                    <th className="py-3.5 px-4">Invoice ID</th>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {invoices.filter(i => i.status === "Unpaid").map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/10 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">{inv.id}</td>
                      <td className="py-4 px-4 font-semibold text-slate-900 dark:text-slate-100">{getStudentName(inv.studentId)}</td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">{inv.description}</td>
                      <td className="py-4 px-4 font-semibold text-rose-500">{inv.dueDate}</td>
                      <td className="py-4 px-4 font-mono font-bold text-[#256ff1]">{inv.amount.toLocaleString()} KSh</td>
                      <td className="py-4 px-4 text-center">
                        <button 
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setInvoiceModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer transition-colors border border-slate-200/50 dark:border-slate-700"
                        >
                          <FaEye size={12} />
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {invoices.filter(i => i.status === "Unpaid").length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 px-4 text-center text-slate-400 font-medium">
                        All invoices have been settled. No pending fees outstanding.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <InvoiceModal 
              isOpen={invoiceModalOpen} 
              onClose={() => setInvoiceModalOpen(false)} 
              invoice={selectedInvoice}
              studentName={selectedInvoice ? getStudentName(selectedInvoice.studentId) : undefined}
            />
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: TEACHER / INSTRUCTOR
  // -------------------------------------------------------------
  if (role === "teacher") {
    const myClasses = classrooms.filter(c => c.teacherId === currentUser.id);
    const myStudents = students.filter(s => myClasses.some(c => c.id === s.classroomId));
    
    return (
      <div className="space-y-6 animate-fade-in w-full">
        <PageHeader 
          title="Instructor Overview" 
          description="Manage your language courses, view registered student rosters, and log evaluations."
        />

        {/* Welcome Info Card */}
        <div className="bg-[#256ff1] text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FaChalkboardTeacher size={18} className="text-blue-200" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200">Instructor Status</span>
            </div>
            <h2 className="text-xl font-black">Welcome back, {currentUser.name}!</h2>
            <p className="text-xs text-blue-100 leading-normal max-w-xl">
              Here is an overview of your assigned language courses and classrooms for the current semester. You can manage student lists, mark daily attendance sheets, and record academic evaluations.
            </p>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Assigned Classes"
            total={myClasses.length}
            iconName="FiHome"
            color="text-[#256ff1]"
            description="Courses under instruction"
          />
          <StatsCard
            title="Total Students"
            total={myStudents.length}
            iconName="FiUsers"
            color="text-indigo-500"
            description="Enrolled in your cohorts"
          />
          <StatsCard
            title="Avg Class Score"
            total={
              grades.filter(g => myClasses.some(c => c.id === g.classroomId)).length > 0
                ? `${Math.round(
                    grades
                      .filter(g => myClasses.some(c => c.id === g.classroomId))
                      .reduce((sum, g) => sum + g.score, 0) /
                      grades.filter(g => myClasses.some(c => c.id === g.classroomId)).length
                  )}%`
                : "-"
            }
            iconName="FiCheckCircle"
            color="text-emerald-500"
            description="Performance average"
          />
        </div>

        {/* Classes Taught list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-extrabold text-slate-950 dark:text-slate-100 mb-4">My Assigned Classrooms</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myClasses.map(c => (
              <div key={c.id} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/10 hover:bg-slate-50/80 dark:hover:bg-slate-850/20 hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex justify-between items-start">
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-base leading-tight">{c.name}</h4>
                  <span className="text-[10px] bg-[#256ff1]/10 text-[#256ff1] px-2.5 py-1 rounded-full font-bold font-mono tracking-wider uppercase">
                    ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-1.5 font-medium">
                  Enrolled Students: <span className="font-bold text-slate-700 dark:text-slate-300">{students.filter(s => s.classroomId === c.id).length} learners</span>
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                  {c.subjectIds.map(subId => (
                    <span key={subId} className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-lg uppercase tracking-wide">
                      {getSubjectName(subId)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {myClasses.length === 0 && (
              <p className="text-slate-400 text-sm py-4 col-span-2">No academic classes are currently assigned to your account profile.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: STUDENT
  // -------------------------------------------------------------
  if (role === "student") {
    const profile = students.find(s => s.id === currentUser.id);
    const classroom = classrooms.find(c => c.id === profile?.classroomId);

    const myGrades = grades.filter(g => g.studentId === currentUser.id);
    const myAttendance = attendance.filter(a => a.studentId === currentUser.id);

    const avgGrade = myGrades.length > 0 
      ? Math.round(myGrades.reduce((sum, g) => sum + g.score, 0) / myGrades.length) 
      : 0;

    const totalClasses = myAttendance.length;
    const presentClasses = myAttendance.filter(a => a.status === "Present" || a.status === "Late").length;
    const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 100;

    return (
      <div className="space-y-6 animate-fade-in w-full">
        <PageHeader 
          title="Student Dashboard" 
          description="Track your language lessons, view grades, check timetables, and settle tuition invoices."
        />

        {/* Student Welcome Header Banner */}
        <div className="bg-[#256ff1] text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FaGraduationCap size={18} className="text-blue-200" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200">Active Student Status</span>
            </div>
            <h2 className="text-xl font-black">Welcome back, {currentUser.name}!</h2>
            <p className="text-xs text-blue-100 leading-normal max-w-xl">
              Track your academic progress, look up class timetables, and settle pending fees online. Your primary language cohort is detailed in your dashboard cards.
            </p>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Grade Point Average"
            total={avgGrade ? `${avgGrade} %` : "-"}
            iconName="FiActivity"
            color="text-[#256ff1]"
            description="Cumulative test score average"
          />
          <StatsCard
            title="Attendance Rate"
            total={`${attendanceRate} %`}
            iconName="FiCalendar"
            color={attendanceRate >= 85 ? "text-emerald-500" : "text-amber-500"}
            description={`Assessed over ${totalClasses} sessions`}
          />
          <StatsCard
            title="Language Level"
            total={classroom?.name || "Unassigned Cohort"}
            iconName="FiHome"
            color="text-indigo-500"
            description="Active group registration"
          />
        </div>

        {/* Timetable Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-[#256ff1]">
            <FaClock size={16} />
            <h2 className="text-base font-extrabold text-slate-950 dark:text-slate-100">Today&apos;s Class Schedule</h2>
          </div>
          
          {classroom ? (
            <div className="space-y-3">
              {classroom.subjectIds.map((subId, index) => (
                <div key={subId} className="flex justify-between items-center p-4 rounded-xl bg-slate-50/50 dark:bg-slate-850/10 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-[#256ff1] flex items-center justify-center font-extrabold text-xs">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{getSubjectName(subId)}</h4>
                      <span className="text-[10px] text-slate-400 font-medium">Instructor Team: Herr Weber / Frau Wagner</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">{index === 0 ? "09:00 AM - 10:30 AM" : index === 1 ? "10:45 AM - 12:15 PM" : "01:00 PM - 02:30 PM"}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-6 font-medium">No class schedule matches available for today.</p>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: PARENT
  // -------------------------------------------------------------
  if (role === "parent") {
    const selectedChild = students.find(s => s.id === selectedChildId);
    const childClassroom = classrooms.find(c => c.id === selectedChild?.classroomId);

    const childGrades = grades.filter(g => g.studentId === selectedChildId);
    const childAttendance = attendance.filter(a => a.studentId === selectedChildId);

    const avgGrade = childGrades.length > 0 
      ? Math.round(childGrades.reduce((sum, g) => sum + g.score, 0) / childGrades.length) 
      : 0;

    const totalClasses = childAttendance.length;
    const presentClasses = childAttendance.filter(a => a.status === "Present" || a.status === "Late").length;
    const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 100;

    return (
      <div className="space-y-6 animate-fade-in w-full">
        {selectedChildId ? (
          <>
            <PageHeader 
              title="Guardian Dashboard" 
              description="Track your child's language learning progress, test grades, and settle tuition invoices."
            />
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard
                title="Grade Average"
                total={avgGrade ? `${avgGrade} %` : "-"}
                iconName="FiActivity"
                color="text-[#256ff1]"
                description="Classroom evaluation performance"
              />
              <StatsCard
                title="Attendance Rate"
                total={`${attendanceRate} %`}
                iconName="FiCalendar"
                color={attendanceRate >= 85 ? "text-emerald-500" : "text-amber-500"}
                description={`Tracked across ${totalClasses} dates`}
              />
              <StatsCard
                title="Language Level"
                total={childClassroom?.name || "Unassigned Cohort"}
                iconName="FiHome"
                color="text-indigo-500"
                description="Assigned course classroom"
              />
            </div>

            {/* Status Info Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-extrabold text-slate-950 dark:text-slate-100 mb-2">Academic & Enrollment Status Overview</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {selectedChild?.name} is actively participating in instructional sessions for language level <span className="font-bold text-slate-700 dark:text-slate-300">{childClassroom?.name || "Unassigned"}</span>. As their registered legal representative, you are fully authorized to track grades, evaluate progress logs, and resolve pending tuition bills online via credit card or direct bank transfer under the &quot;Payments&quot; tab.
              </p>
            </div>
          </>
        ) : (
          <p className="text-slate-400 text-center py-10 font-medium">Please select a linked child above to view reports.</p>
        )}
      </div>
    );
  }

  return null;
}
