"use client";

import React, { useState } from "react";
import { useSchool } from "@/context/SchoolContext";
import { PageHeader } from "@/components/PageHeader";
import StatsCard from "@/components/StatsCard";
import CustomTable from "@/components/ui/CustomTable";
import { FaGraduationCap, FaSearch } from "react-icons/fa";

export default function Students() {
  const {
    currentUser,
    students,
    classrooms,
    addStudent,
    grades,
    attendance
  } = useSchool();

  // Localized UI and form states
  const [studentSearch, setStudentSearch] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentClassId, setStudentClassId] = useState("");
  const [studentParentEmail, setStudentParentEmail] = useState("");

  if (!currentUser) return null;

  const role = currentUser.role;

  // Helper resolvers
  const getClassroomName = (id: string) => classrooms.find(c => c.id === id)?.name || "Unassigned";

  // -------------------------------------------------------------
  // RENDER: SUPER-ADMIN & ADMIN (Students Register)
  // -------------------------------------------------------------
  if (role === "super-admin" || role === "admin") {
    const handleAddStudent = (e: React.FormEvent) => {
      e.preventDefault();
      if (!studentName || !studentEmail || !studentClassId) return;
      addStudent(studentName, studentEmail, studentClassId, studentParentEmail || undefined);
      setStudentName("");
      setStudentEmail("");
      setStudentClassId("");
      setStudentParentEmail("");
      alert("Student profile registered and enrolled successfully!");
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
            onClick: () => {
              const element = document.getElementById("enroll-student-form");
              if (element) {
                element.scrollIntoView({ behavior: "smooth" });
                element.classList.add("ring-4", "ring-[#256ff1]/20", "border-[#256ff1]");
                setTimeout(() => {
                  element.classList.remove("ring-4", "ring-[#256ff1]/20", "border-[#256ff1]");
                }, 2000);
              }
            }
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

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Student List */}
          <div className="xl:col-span-8 flex flex-col gap-4">
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
              pageSize={6}
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

          {/* Form */}
          <div id="enroll-student-form" className="xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm shadow-slate-100/10 h-fit transition-all duration-300">
            <div className="flex items-center gap-2 mb-4 text-[#256ff1]">
              <FaGraduationCap size={20} />
              <h2 className="text-base font-extrabold text-slate-950 dark:text-slate-100">Enroll New Student</h2>
            </div>
            
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Full Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Jonas Wagner"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-[#256ff1] focus:ring-1 focus:ring-[#256ff1]/10 transition-all font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Email Address</label>
                <input 
                  type="email" 
                  required 
                  placeholder="jonas@student.de"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-[#256ff1] focus:ring-1 focus:ring-[#256ff1]/10 transition-all font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Class Level Assignment</label>
                <select 
                  required 
                  value={studentClassId}
                  onChange={(e) => setStudentClassId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:border-[#256ff1] focus:ring-1 focus:ring-[#256ff1]/10 transition-all font-bold cursor-pointer"
                >
                  <option value="">Choose class...</option>
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Parent/Guardian Email (Optional)</label>
                <input 
                  type="email" 
                  placeholder="parent@mail.de"
                  value={studentParentEmail}
                  onChange={(e) => setStudentParentEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-[#256ff1] focus:ring-1 focus:ring-[#256ff1]/10 transition-all font-medium"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 bg-[#256ff1] hover:bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer transition-all duration-200 shadow-md shadow-[#256ff1]/10 mt-2 text-center"
              >
                Register & Enroll Student
              </button>
            </form>
          </div>
        </div>
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
