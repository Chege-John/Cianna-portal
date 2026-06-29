"use client";

import React, { useState, useEffect, Suspense } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { useSchool } from "@/context/SchoolContext";
import { useRouter, useSearchParams } from "next/navigation";
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
import { FaGraduationCap, FaTimes, FaSpinner, FaRegCreditCard } from "react-icons/fa";
import { FiUser, FiMail, FiBookOpen, FiUsers } from "react-icons/fi";

function StudentsContent() {
  const { currentUser } = useSchool();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchName = searchParams.get("search");
  
  // Data Fetching
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: classrooms = [], isLoading: classroomsLoading } = useClassrooms();
  const { data: grades = [], isLoading: gradesLoading } = useGrades();
  const { data: attendance = [], isLoading: attendanceLoading } = useAttendance();
  
  // Mutations
  const { addStudent } = useSchoolMutations();


  // Localized UI and form states
  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    if (searchName) {
      setStudentSearch(searchName);
    }
  }, [searchName]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentClassId, setStudentClassId] = useState("");
  const [dob, setDob] = useState("");
  const [nationality, setNationality] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [profession, setProfession] = useState("");
  const [courseLevel, setCourseLevel] = useState("");
  const [schedule, setSchedule] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianRelationship, setGuardianRelationship] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
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
  const getClassroomName = (id?: string | null) => id ? (classrooms.find(c => c.id === id)?.name || "Unassigned") : "Unassigned";

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
      if (!firstName || !lastName || !studentEmail || !studentClassId || !courseLevel || !schedule) return;
      
      const fullName = `${firstName} ${lastName}`;
      
      addStudent.mutate({
        name: fullName,
        email: studentEmail,
        classroomId: studentClassId,
        firstName,
        lastName,
        dob,
        nationality,
        idNumber,
        profession,
        courseLevel: courseLevel as "A1" | "A2" | "B1" | "B2",
        schedule: schedule as "Online" | "Physical" | "Hybrid",
        phoneNumber,
        guardianName,
        guardianRelationship,
        guardianPhone,
        parentEmail: studentParentEmail || undefined
      }, {
        onSuccess: () => {
          setFirstName("");
          setLastName("");
          setStudentEmail("");
          setStudentClassId("");
          setDob("");
          setNationality("");
          setIdNumber("");
          setProfession("");
          setCourseLevel("");
          setSchedule("");
          setPhoneNumber("");
          setGuardianName("");
          setGuardianRelationship("");
          setGuardianPhone("");
          setStudentParentEmail("");
          setIsEnrollModalOpen(false);
          
          toast.success("Student enrolled & credentials emailed!", {
            position: "bottom-left",
            duration: 5000,
          });
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
                accessor: (student) => <span className="text-xs text-slate-455 dark:text-slate-400 font-mono">{student.parentEmail || "Not Provided"}</span>
              },
              {
                header: "Financial History",
                align: "center",
                accessor: (student) => (
                  <button
                    onClick={() => {
                      router.push(`/dashboard/${role}/payments?studentId=${student.id}`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#256ff1]/10 text-[#256ff1] hover:bg-[#256ff1] hover:text-white dark:bg-[#256ff1]/20 dark:text-blue-400 dark:hover:bg-[#256ff1] dark:hover:text-white rounded-xl cursor-pointer transition-all duration-300"
                  >
                    <FaRegCreditCard size={12} />
                    View Payments
                  </button>
                )
              }
            ]}
          />
        </div>

        {/* Enroll Student Modal with premium aesthetics & backdrop blur (rendered via Portal) */}
        {isEnrollModalOpen && mounted && createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Backdrop with soft blur */}
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
              onClick={() => setIsEnrollModalOpen(false)}
            />
            
            {/* Form Container */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm shadow-slate-100/10 dark:shadow-none transition-all duration-300 transform scale-100 z-10 animate-scale-up max-h-[90vh] overflow-y-auto scrollbar-thin">
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setIsEnrollModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                aria-label="Close modal"
              >
                <FaTimes size={18} />
              </button>

              <div className="flex items-center gap-2 mb-6 text-[#256ff1]">
                <FaGraduationCap size={24} />
                <h2 className="text-xl font-extrabold text-slate-950 dark:text-slate-100">Enroll New Student</h2>
              </div>
              
              <form onSubmit={handleAddStudent} className="space-y-8">
                {/* 1. Personal Information */}
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">First Name</label>
                      <input 
                        type="text" required placeholder="e.g. Jonas" value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950"
                        style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Last Name</label>
                      <input 
                        type="text" required placeholder="e.g. Wagner" value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950"
                        style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Date of Birth</label>
                      <input 
                        type="date" required value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950"
                        style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Nationality</label>
                      <input 
                        type="text" required placeholder="e.g. German" value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950"
                        style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">ID Number</label>
                      <input 
                        type="text" required placeholder="Passport or ID" value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950"
                        style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Profession/Occupation</label>
                      <input 
                        type="text" required placeholder="e.g. Engineer" value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950"
                        style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Courses & Schedule */}
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Course Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Course Level</label>
                      <CustomSelect
                        options={[
                          { value: "A1", label: "Level A1" },
                          { value: "A2", label: "Level A2" },
                          { value: "B1", label: "Level B1" },
                          { value: "B2", label: "Level B2" },
                        ]}
                        value={courseLevel}
                        onChange={setCourseLevel}
                        placeholder="Select Level..."
                        buttonClassName="!border-2 !border-gray-200 dark:!border-slate-800 !rounded-xl"
                        style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                        size="lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Preferred Schedule</label>
                      <CustomSelect
                        options={[
                          { value: "Online", label: "Online" },
                          { value: "Physical", label: "Physical" },
                          { value: "Hybrid", label: "Hybrid" },
                        ]}
                        value={schedule}
                        onChange={setSchedule}
                        placeholder="Select Schedule..."
                        buttonClassName="!border-2 !border-gray-200 dark:!border-slate-800 !rounded-xl"
                        style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                        size="lg"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Class Cohort Assignment</label>
                      <CustomSelect
                        options={classrooms.map(c => ({ value: c.id, label: c.name }))}
                        value={studentClassId}
                        onChange={setStudentClassId}
                        placeholder="Choose class..."
                        buttonClassName="!border-2 !border-gray-200 dark:!border-slate-800 !rounded-xl"
                        style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                        size="lg"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Contact Information */}
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Phone Number</label>
                      <input 
                        type="tel" required placeholder="+49 ..." value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950"
                        style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Email Address</label>
                      <input 
                        type="email" required placeholder="jonas@student.de" value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950"
                        style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Guardian Details */}
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Guardian Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Guardian Name</label>
                      <input 
                        type="text" placeholder="Full Name" value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950"
                        style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Relationship</label>
                      <input 
                        type="text" placeholder="e.g. Father" value={guardianRelationship}
                        onChange={(e) => setGuardianRelationship(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950"
                        style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Guardian Phone</label>
                      <input 
                        type="tel" placeholder="+49 ..." value={guardianPhone}
                        onChange={(e) => setGuardianPhone(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950"
                        style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Guardian Email</label>
                      <input 
                        type="email" placeholder="parent@mail.de" value={studentParentEmail}
                        onChange={(e) => setStudentParentEmail(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950"
                        style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 sticky bottom-0 bg-white dark:bg-slate-900 py-4 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="button"
                    onClick={() => setIsEnrollModalOpen(false)}
                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={addStudent.isPending}
                    className="flex-[2] bg-[#256ff1] hover:bg-blue-600 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl 
                      transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]
                      cursor-pointer shadow-sm hover:shadow-md shadow-[#256ff1]/30 text-center text-sm flex items-center justify-center gap-2"
                  >
                    {addStudent.isPending ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Processing Enrollment...
                      </>
                    ) : (
                      "Complete Enrollment"
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

export default function Students() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#256ff1] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <StudentsContent />
    </Suspense>
  );
}
