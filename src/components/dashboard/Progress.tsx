"use client";

import React, { useState } from "react";
import { useSchool } from "@/context/SchoolContext";
import { 
  useStudents, 
  useClassrooms, 
  useSubjects, 
  useGrades, 
  useAttendance, 
  useSchoolMutations 
} from "@/hooks/use-school-data";
import { PageHeader } from "@/components/PageHeader";
import CustomSelect from "@/components/ui/CustomSelect";
import StatsCard from "@/components/StatsCard";
import CustomTable from "@/components/ui/CustomTable";
import { 
  FaChartLine, 
  FaPlus, 
  FaAward, 
  FaCalendarAlt,
  FaSpinner
} from "react-icons/fa";

interface ProgressProps {
  selectedChildId?: string;
}

export default function Progress({ selectedChildId }: ProgressProps) {
  const { currentUser } = useSchool();
  
  // Data Fetching
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: classrooms = [], isLoading: classroomsLoading } = useClassrooms();
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const { data: grades = [], isLoading: gradesLoading } = useGrades();
  const { data: attendance = [], isLoading: attendanceLoading } = useAttendance();
  
  // Mutations
  const { recordGrade } = useSchoolMutations();


  // Localized UI and Search States
  // For Admin:
  const [progressStudentSearch, setProgressStudentSearch] = useState("");
  const [gradeSearch, setGradeSearch] = useState("");

  // For Teacher Form:
  const [teacherClassId, setTeacherClassId] = useState("");
  const [gradeStudentId, setGradeStudentId] = useState("");
  const [gradeSubjectId, setGradeSubjectId] = useState("");
  const [gradeScore, setGradeScore] = useState("");

  const isLoading = studentsLoading || classroomsLoading || subjectsLoading || gradesLoading || attendanceLoading;

  if (!currentUser) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#256ff1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const role = currentUser.role;

  // Global helper resolvers
  const getClassroomName = (id?: string | null) => id ? (classrooms.find(c => c.id === id)?.name || "Unassigned") : "Unassigned";
  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || "No Subject";
  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || "Unknown Student";

  // -------------------------------------------------------------
  // RENDER: SUPER-ADMIN & ADMIN (Academic Ledger / Performance)
  // -------------------------------------------------------------
  if (role === "super-admin" || role === "admin") {
    const filteredProgressStudents = students.filter(s => 
      s.name.toLowerCase().includes(progressStudentSearch.toLowerCase()) ||
      getClassroomName(s.classroomId).toLowerCase().includes(progressStudentSearch.toLowerCase())
    );

    const filteredGrades = grades.filter(g => 
      getStudentName(g.studentId).toLowerCase().includes(gradeSearch.toLowerCase()) ||
      getSubjectName(g.subjectId).toLowerCase().includes(gradeSearch.toLowerCase())
    );

    return (
      <div className="space-y-6 animate-fade-in w-full">
        <PageHeader 
          title="Performance Ledger" 
          description="Audit language acquisition progress, exam records, and academic score averages."
        />

        {/* Academic Performance Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Average Class Grade"
            total={grades.length > 0 
              ? `${Math.round(grades.reduce((sum, g) => sum + g.score, 0) / grades.length)} %` 
              : "-"}
            iconName="FiActivity"
            color="text-[#256ff1]"
            description="Institute-wide average"
          />
          <StatsCard
            title="Completed Exams"
            total={grades.length}
            iconName="FiCheckCircle"
            color="text-emerald-500"
            description="Evaluations evaluated"
          />
          <StatsCard
            title="Highest Achieved"
            total={grades.length > 0 ? `${Math.max(...grades.map(g => g.score))}%` : "-"}
            iconName="FiShield"
            color="text-indigo-500"
            description="Top exam score recorded"
          />
          <StatsCard
            title="Exam Passing Rate"
            total={grades.length > 0 
              ? `${Math.round((grades.filter(g => g.score >= 50).length / grades.length) * 100)} %` 
              : "-"}
            iconName="FiClock"
            color="text-amber-500"
            description="Scores at A1-C2 passing"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Student Performance Roster */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="mb-1">
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">Student Performance Ledger</h2>
              <p className="text-xs text-slate-400 mt-0.5">Calculated average testing score for each student.</p>
            </div>
            
            <CustomTable
              data={filteredProgressStudents}
              searchQuery={progressStudentSearch}
              onSearchChange={setProgressStudentSearch}
              searchPlaceholder="Search student..."
              noun="students"
              pageSize={6}
              columns={[
                {
                  header: "Student Name",
                  accessor: (stud) => <span className="font-semibold text-slate-900 dark:text-slate-100">{stud.name}</span>
                },
                {
                  header: "Classroom",
                  accessor: (stud) => <span className="text-xs text-slate-550 dark:text-slate-400">{getClassroomName(stud.classroomId)}</span>
                },
                {
                  header: "Average Performance",
                  align: "right",
                  accessor: (stud) => {
                    const studentGrades = grades.filter(g => g.studentId === stud.id);
                    const average = studentGrades.length > 0 
                      ? Math.round(studentGrades.reduce((sum, g) => sum + g.score, 0) / studentGrades.length) 
                      : null;
                    return average !== null ? (
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${average >= 85 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300"}`}>
                        {average} %
                      </span>
                    ) : (
                      <span className="text-slate-350 dark:text-slate-500 text-xs italic font-semibold">No Grades</span>
                    );
                  }
                }
              ]}
            />
          </div>

          {/* Recent Grade Book Logs */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="mb-1">
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">Academic Grade Log</h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest marks committed to database by instructors.</p>
            </div>
            
            <CustomTable
              data={filteredGrades}
              searchQuery={gradeSearch}
              onSearchChange={setGradeSearch}
              searchPlaceholder="Search grade log..."
              noun="grades"
              pageSize={6}
              columns={[
                {
                  header: "Date",
                  accessor: (g) => <span className="font-mono text-slate-400 dark:text-slate-500 font-bold">{g.date}</span>
                },
                {
                  header: "Student",
                  accessor: (g) => <span className="font-semibold text-slate-800 dark:text-slate-200">{getStudentName(g.studentId)}</span>
                },
                {
                  header: "Module",
                  accessor: (g) => <span className="text-slate-650 dark:text-slate-400 font-medium">{getSubjectName(g.subjectId)}</span>
                },
                {
                  header: "Score",
                  align: "right",
                  accessor: (g) => <span className="font-mono font-bold text-[#256ff1] dark:text-blue-400 text-sm">{g.score} %</span>
                }
              ]}
            />
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: TEACHER (Academic Evaluations / Record Grade)
  // -------------------------------------------------------------
  if (role === "teacher") {
    const myClasses = classrooms.filter(c => c.teacherId === currentUser.id);
    const classStudents = students.filter(s => s.classroomId === teacherClassId);
    const activeClassroom = classrooms.find(c => c.id === teacherClassId);

    const handleSaveGrade = (e: React.FormEvent) => {
      e.preventDefault();
      if (!teacherClassId || !gradeStudentId || !gradeSubjectId || !gradeScore) return;

      recordGrade.mutate({
        studentId: gradeStudentId,
        classroomId: teacherClassId,
        subjectId: gradeSubjectId,
        score: parseInt(gradeScore),
        gradedBy: currentUser.name
      }, {
        onSuccess: () => {
          setGradeStudentId("");
          setGradeScore("");
          setGradeSubjectId("");
          alert("Official student evaluation grade recorded successfully!");
        }
      });
    };

    const myClassGrades = grades.filter(g => myClasses.some(c => c.id === g.classroomId));

    return (
      <div className="space-y-6 animate-fade-in w-full">
        <PageHeader 
          title="Academic Evaluations" 
          description="Log individual course module scores, test grades, and view historical eval ledgers."
        />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Record Grade Form Panel */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm h-fit">
            <div className="flex items-center gap-2 mb-4 text-[#256ff1]">
              <FaPlus size={16} />
              <h2 className="text-base font-extrabold text-slate-950 dark:text-slate-100">Record Evaluation Grade</h2>
            </div>
            
            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Select Class
                </label>
                <CustomSelect
                  options={myClasses.map(c => ({ value: c.id, label: c.name }))}
                  value={teacherClassId}
                  onChange={(val) => {
                    setTeacherClassId(val);
                    setGradeStudentId("");
                    setGradeSubjectId("");
                  }}
                  placeholder="Choose class..."
                  buttonClassName="!border-2 !border-gray-200 dark:!border-slate-800 !rounded-xl hover:!border-[#256ff1]/60 transition-all !text-slate-800 dark:!text-slate-200 font-semibold"
                  style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                  size="lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Select Student
                </label>
                <CustomSelect
                  disabled={!teacherClassId}
                  options={classStudents.map(s => ({ value: s.id, label: s.name }))}
                  value={gradeStudentId}
                  onChange={setGradeStudentId}
                  placeholder={teacherClassId ? "Choose student..." : "Select class first..."}
                  buttonClassName="!border-2 !border-gray-200 dark:!border-slate-800 !rounded-xl hover:!border-[#256ff1]/60 transition-all !text-slate-800 dark:!text-slate-200 font-semibold"
                  style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                  size="lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Assessed Course Module
                </label>
                <CustomSelect
                  disabled={!teacherClassId}
                  options={(activeClassroom?.subjectIds || []).map(subId => ({ value: subId, label: getSubjectName(subId) }))}
                  value={gradeSubjectId}
                  onChange={setGradeSubjectId}
                  placeholder={teacherClassId ? "Choose module..." : "Select class first..."}
                  buttonClassName="!border-2 !border-gray-200 dark:!border-slate-800 !rounded-xl hover:!border-[#256ff1]/60 transition-all !text-slate-800 dark:!text-slate-200 font-semibold"
                  style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                  size="lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Evaluation Score (0 - 100%)
                </label>
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  required 
                  placeholder="e.g. 85"
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                  className="w-full px-4 py-3 backdrop-blur-md border-2 border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 dark:text-slate-200 placeholder-slate-400 bg-white"
                  style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                />
              </div>

              <button 
                type="submit" 
                disabled={recordGrade.isPending || !teacherClassId || !gradeStudentId || !gradeSubjectId || !gradeScore}
                className="w-full py-3 bg-[#256ff1] hover:bg-blue-600 text-white font-bold text-sm rounded-xl cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-md shadow-[#256ff1]/10 flex items-center justify-center gap-2"
              >
                {recordGrade.isPending ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Saving Evaluation...
                  </>
                ) : (
                  "Log Grade Entry"
                )}
              </button>
            </form>
          </div>

          {/* Recent Grades Ledger Panel */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950 dark:text-slate-100 mb-4">Historical Grade Ledger</h2>
            <div className="overflow-x-auto border border-slate-150/60 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-sm min-w-[400px]">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-850/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                    <th className="p-3.5">Date Entered</th>
                    <th className="p-3.5">Student</th>
                    <th className="p-3.5">Course Module</th>
                    <th className="p-3.5 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {myClassGrades.map(g => (
                    <tr key={g.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/20 transition-colors">
                      <td className="p-3.5 font-mono text-slate-400 dark:text-slate-500 font-bold">{g.date}</td>
                      <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-150">{getStudentName(g.studentId)}</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 font-semibold">{getSubjectName(g.subjectId)}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-450">{g.score} %</td>
                    </tr>
                  ))}
                  {myClassGrades.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400 dark:text-slate-500 font-semibold">
                        No evaluations have been recorded for your class cohorts yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: STUDENT (Academic Transcript)
  // -------------------------------------------------------------
  if (role === "student") {
    const myGrades = grades.filter(g => g.studentId === currentUser.id);

    return (
      <div className="space-y-6 animate-fade-in w-full">
        <PageHeader 
          title="Academic Transcript" 
          description="View your official evaluation grades, assessed modules, and teacher marks."
        />
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-[#256ff1]">
            <FaChartLine size={18} />
            <h2 className="text-lg font-black text-slate-950 dark:text-slate-100">My Academic Transcript</h2>
          </div>
        
          <div className="overflow-x-auto border border-slate-150/60 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-sm min-w-[500px]">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-850/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                  <th className="p-3.5">Evaluation Date</th>
                  <th className="p-3.5">Course Module</th>
                  <th className="p-3.5">Examiner</th>
                  <th className="p-3.5 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {myGrades.map(g => (
                  <tr key={g.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/20 transition-colors">
                    <td className="p-3.5 font-mono text-slate-400 dark:text-slate-500 text-xs font-bold">{g.date}</td>
                    <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">{getSubjectName(g.subjectId)}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400 font-semibold">{g.gradedBy}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-[#256ff1]">{g.score} %</td>
                  </tr>
                ))}
                {myGrades.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400 dark:text-slate-500 font-medium">
                      No evaluation grades have been entered for your profile.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: PARENT (Academic Progress Report for selectedChildId)
  // -------------------------------------------------------------
  if (role === "parent") {
    if (!selectedChildId) {
      return (
        <div className="space-y-6 animate-fade-in w-full">
          <PageHeader 
            title="Academic Progress Report" 
            description="Review evaluation grades, assessed course modules, and official teacher attendance logs."
          />
          <div className="p-6 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-500 text-center font-medium">
            Please choose a child profile from the dashboard header to inspect their academic progress metrics.
          </div>
        </div>
      );
    }

    const childProfile = students.find(s => s.id === selectedChildId);
    const childClassroom = classrooms.find(c => c.id === childProfile?.classroomId);
    const childGrades = grades.filter(g => g.studentId === selectedChildId);
    const childAttendance = attendance.filter(a => a.studentId === selectedChildId);

    return (
      <div className="space-y-6 animate-fade-in w-full">
        <PageHeader 
          title="Academic Progress Report" 
          description={`Review evaluation grades, assessed course modules, and official teacher attendance logs for ${childProfile?.name || "Student"}.`}
        />
        
        {/* Detailed Grades */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-[#256ff1]">
            <FaAward size={18} />
            <h2 className="text-lg font-black text-slate-950 dark:text-slate-100">Academic Evaluation Logs</h2>
          </div>
          
          <div className="overflow-x-auto border border-slate-150/60 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-sm min-w-[500px]">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-850/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                  <th className="p-3.5">Evaluation Date</th>
                  <th className="p-3.5">Assessed Course Module</th>
                  <th className="p-3.5">Assessed By</th>
                  <th className="p-3.5 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {childGrades.map(g => (
                  <tr key={g.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/20 transition-colors">
                    <td className="p-3.5 font-mono text-slate-400 dark:text-slate-500 text-xs font-bold">{g.date}</td>
                    <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">{getSubjectName(g.subjectId)}</td>
                    <td className="p-3.5 text-slate-650 dark:text-slate-400 font-semibold">{g.gradedBy}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-[#256ff1]">{g.score} %</td>
                  </tr>
                ))}
                {childGrades.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400 dark:text-slate-500 font-medium">
                      No testing evaluation logs have been recorded for this student yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Attendance Log History */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-[#256ff1]">
            <FaCalendarAlt size={18} />
            <h2 className="text-lg font-black text-slate-950 dark:text-slate-100">Class Attendance Log History</h2>
          </div>
          
          <div className="overflow-x-auto border border-slate-150/60 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-sm min-w-[500px]">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-850/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                  <th className="p-3.5">Class Date</th>
                  <th className="p-3.5">Classroom Cohort</th>
                  <th className="p-3.5 text-right">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {childAttendance.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/20 transition-colors">
                    <td className="p-3.5 font-mono text-slate-400 dark:text-slate-500 text-xs font-bold">{a.date}</td>
                    <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{childClassroom?.name || "German Course Classroom"}</td>
                    <td className="p-3.5 text-right">
                      {a.status === "Present" && (
                        <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-[10px] font-bold uppercase tracking-wide">Present</span>
                      )}
                      {a.status === "Late" && (
                        <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 rounded-lg text-[10px] font-bold uppercase tracking-wide">Late</span>
                      )}
                      {a.status === "Absent" && (
                        <span className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 rounded-lg text-[10px] font-bold uppercase tracking-wide">Absent</span>
                      )}
                    </td>
                  </tr>
                ))}
                {childAttendance.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-slate-400 dark:text-slate-500 font-medium">
                      No session attendance dates are recorded for this student.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
