"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSchool } from "@/context/SchoolContext";
import { 
  useStudents, 
  useClassrooms, 
  useGrades, 
  useAttendance, 
  useSchoolMutations 
} from "@/hooks/use-school-data";
import { PageHeader } from "@/components/PageHeader";
import StatsCard from "@/components/StatsCard";
import CustomTable from "@/components/ui/CustomTable";
import CustomSelect from "@/components/ui/CustomSelect";
import { FaGraduationCap, FaTimes, FaSpinner } from "react-icons/fa";
import { FiUser, FiMail, FiBookOpen, FiUsers } from "react-icons/fi";

export default function Students() {
  const { currentUser } = useSchool();
  
  // Data Fetching
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: classrooms = [], isLoading: classroomsLoading } = useClassrooms();
  const { data: grades = [], isLoading: gradesLoading } = useGrades();
  const { data: attendance = [], isLoading: attendanceLoading } = useAttendance();
  
  // Mutations
  const { addStudent } = useSchoolMutations();


  // Localized UI and form states
  const [studentSearch, setStudentSearch] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentClassId, setStudentClassId] = useState("");
  const [studentParentEmail, setStudentParentEmail] = useState("");

  // Modal display states
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Esc key & body scroll lock listener for modern modal UX
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsEnrollModalOpen(false);
      }
    };
    if (isEnrollModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isEnrollModalOpen]);

  if (!currentUser) return null;

  // Helper resolvers
  const getClassroomName = (id: string) => classrooms.find(c => c.id === id)?.name || "Unassigned";

  const isLoading = studentsLoading || classroomsLoading || gradesLoading || attendanceLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#256ff1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const role = currentUser.role;

  // -------------------------------------------------------------
  // RENDER: SUPER-ADMIN & ADMIN (Students Register)
  // -------------------------------------------------------------
  if (role === "super-admin" || role === "admin") {
    const handleAddStudent = (e: React.FormEvent) => {
      e.preventDefault();
      if (!studentName || !studentEmail || !studentClassId) return;
      
      addStudent.mutate({
        name: studentName,
        email: studentEmail,
        classroomId: studentClassId,
        parentEmail: studentParentEmail || undefined
      }, {
        onSuccess: () => {
          setStudentName("");
          setStudentEmail("");
          setStudentClassId("");
          setStudentParentEmail("");
          setIsEnrollModalOpen(false);
          // Optional: Replace alert with toast if available
          alert("Student profile registered and enrolled successfully!");
        }
      });
    };

    const filteredStudents = students.filter(s => 
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
      s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      getClassroomName(s.classroomId).toLowerCase().includes(studentSearch.toLowerCase())
    );

    return (
      <div className="space-y-6 animate-fade-in w-full">
        <PageHeader 
          title="Students Register" 
          description="Enroll learners, assign classes, and manage student directories."
          actionButton={{
            text: "Enroll Student",
            icon: <FaGraduationCap size={12} />,
            onClick: () => setIsEnrollModalOpen(true)
          }}
        />

        {/* Enrollment Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Enrolled"
            total={students.length}
            iconName="FiUsers"
            color="text-[#256ff1]"
            description="Actively learning students"
          />
          <StatsCard
            title="Assigned to Classes"
            total={students.filter(s => s.classroomId).length}
            iconName="FiCheckCircle"
            color="text-emerald-500"
            description="Placed in language cohorts"
          />
          <StatsCard
            title="Awaiting Placement"
            total={students.filter(s => !s.classroomId).length}
            iconName="FiClock"
            color="text-amber-500"
            description="Pending class assignment"
          />
          <StatsCard
            title="Linked Guardians"
            total={students.filter(s => s.parentEmail).length}
            iconName="FiHome"
            color="text-indigo-500"
            description="Family account links"
          />
        </div>

        {/* Student Register List Table */}
        <div className="w-full flex flex-col gap-4">
          <div className="mb-1">
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">Active Students Register</h2>
            <p className="text-xs text-slate-400 mt-0.5">Track class levels, parent contact links, and student rosters.</p>
          </div>
          
          <CustomTable
            data={filteredStudents}
            searchQuery={studentSearch}
            onSearchChange={setStudentSearch}
            searchPlaceholder="Search students or classes..."
            noun="students"
            pageSize={8}
            columns={[
              {
                header: "Full Name",
                accessor: (student) => <span className="font-semibold text-slate-900 dark:text-slate-100">{student.name}</span>
              },
              {
                header: "Credential Email",
                accessor: (student) => <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">{student.email}</span>
              },
              {
                header: "Assigned Class",
                accessor: (student) => (
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300 rounded-lg text-xs font-semibold">
                    {getClassroomName(student.classroomId)}
                  </span>
                )
              },
              {
                header: "Parent Guardian Email",
                accessor: (student) => <span className="text-xs text-slate-450 dark:text-slate-400 font-mono">{student.parentEmail || "Not Provided"}</span>
              }
            ]}
          />
        </div>

        {/* Enroll Student Modal with premium aesthetics & backdrop blur (rendered via Portal) */}
        {isEnrollModalOpen && mounted && createPortal(
          <div className="fixed inset-0 z-2000 flex items-center justify-center p-4">
            {/* Backdrop with soft blur */}
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
              onClick={() => setIsEnrollModalOpen(false)}
            />
            
            {/* Form Container */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm shadow-slate-100/10 dark:shadow-none transition-all duration-300 transform scale-100 z-10 animate-scale-up">
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setIsEnrollModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                aria-label="Close modal"
              >
                <FaTimes size={16} />
              </button>

              <div className="flex items-center gap-2 mb-4 text-[#256ff1]">
                <FaGraduationCap size={18} />
                <h2 className="text-base font-extrabold text-slate-950 dark:text-slate-100">Enroll New Student</h2>
              </div>
              
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Jonas Wagner"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-4 py-3 backdrop-blur-md border-2 border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 dark:text-slate-200 placeholder-slate-400 bg-white"
                    style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    required 
                    placeholder="jonas@student.de"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="w-full px-4 py-3 backdrop-blur-md border-2 border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 dark:text-slate-200 placeholder-slate-400 bg-white"
                    style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                    Class Level Assignment
                  </label>
                  <CustomSelect
                    options={classrooms.map(c => ({ value: c.id, label: c.name }))}
                    value={studentClassId}
                    onChange={setStudentClassId}
                    placeholder="Choose class..."
                    buttonClassName="!border-2 !border-gray-200 dark:!border-slate-800 !rounded-xl hover:!border-[#256ff1]/60 transition-all !text-slate-800 dark:!text-slate-200 font-semibold"
                    style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                    size="lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                    Parent/Guardian Email (Optional)
                  </label>
                  <input 
                    type="email" 
                    placeholder="parent@mail.de"
                    value={studentParentEmail}
                    onChange={(e) => setStudentParentEmail(e.target.value)}
                    className="w-full px-4 py-3 backdrop-blur-md border-2 border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 dark:text-slate-200 placeholder-slate-400 bg-white"
                    style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsEnrollModalOpen(false)}
                    className="w-1/3 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={addStudent.isPending}
                    className="w-2/3 bg-[#256ff1] hover:bg-blue-600 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl 
                      transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]
                      cursor-pointer shadow-sm hover:shadow-md shadow-[#256ff1]/30 text-center text-sm flex items-center justify-center gap-2"
                  >
                    {addStudent.isPending ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Enroll Student"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: TEACHER (Cohort Directory with Attendance + Grades summaries)
  // -------------------------------------------------------------
  if (role === "teacher") {
    const myClasses = classrooms.filter(c => c.teacherId === currentUser.id);
    const myStudents = students.filter(s => myClasses.some(c => c.id === s.classroomId));

    const filteredTeacherStudents = myStudents.filter(s => 
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      getClassroomName(s.classroomId).toLowerCase().includes(studentSearch.toLowerCase())
    );

    return (
      <div className="space-y-6 animate-fade-in w-full">
        <PageHeader 
          title="Student Directory" 
          description="Explore attendance ratios, average performance scores, and contact links for your cohort."
        />

        <div className="flex flex-col gap-4">
          <div className="mb-1">
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">Student Cohorts Roster</h2>
            <p className="text-xs text-slate-400 mt-0.5">Directory of active learners registered in your assigned classrooms.</p>
          </div>

          <CustomTable
            data={filteredTeacherStudents}
            searchQuery={studentSearch}
            onSearchChange={setStudentSearch}
            searchPlaceholder="Search students or class levels..."
            noun="students"
            pageSize={6}
            columns={[
              {
                header: "Full Name",
                accessor: (student) => <span className="font-semibold text-slate-900 dark:text-slate-100">{student.name}</span>
              },
              {
                header: "Email Address",
                accessor: (student) => <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">{student.email}</span>
              },
              {
                header: "Assigned Class Level",
                accessor: (student) => (
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300 rounded-lg text-xs font-semibold">
                    {getClassroomName(student.classroomId)}
                  </span>
                )
              },
              {
                header: "Parent Guardian Email",
                accessor: (student) => <span className="text-xs text-slate-400 font-mono">{student.parentEmail || "None Connected"}</span>
              },
              {
                header: "Academic Records",
                align: "right",
                accessor: (student) => {
                  const studentGrades = grades.filter(g => g.studentId === student.id);
                  const studentAttendance = attendance.filter(a => a.studentId === student.id);
                  const avg = studentGrades.length > 0 
                    ? Math.round(studentGrades.reduce((sum, g) => sum + g.score, 0) / studentGrades.length) 
                    : null;
                  const pres = studentAttendance.length > 0
                    ? Math.round((studentAttendance.filter(a => a.status === "Present" || a.status === "Late").length / studentAttendance.length) * 100)
                    : null;

                  return (
                    <div className="inline-flex items-center gap-3 text-xs">
                      {pres !== null && (
                        <span className="text-[11px] font-bold text-slate-500">
                          Att: <span className={pres >= 85 ? "text-emerald-600 font-extrabold" : "text-amber-500 font-extrabold"}>{pres}%</span>
                        </span>
                      )}
                      {avg !== null ? (
                        <span className="text-[11px] font-bold text-[#256ff1] dark:text-blue-400">
                          Avg: {avg}%
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-300 dark:text-slate-600">No Grades</span>
                      )}
                    </div>
                  );
                }
              }
            ]}
          />
        </div>
      </div>
    );
  }

  return null;
}
