"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSchool, AttendanceStatus } from "@/context/SchoolContext";
import { 
  useStudents, 
  useClassrooms, 
  useSubjects, 
  useTeachers, 
  useSchoolMutations 
} from "@/hooks/use-school-data";
import { PageHeader } from "@/components/PageHeader";
import CustomSelect from "@/components/ui/CustomSelect";
import StatsCard from "@/components/StatsCard";
import { 
  FaSchool, 
  FaUserCheck, 
  FaCalendarAlt,
  FaTimes,
  FaSpinner
} from "react-icons/fa";

export default function Classes() {
  const { currentUser } = useSchool();
  
  // Data Fetching
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: classrooms = [], isLoading: classroomsLoading } = useClassrooms();
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const { data: teachers = [], isLoading: teachersLoading } = useTeachers();
  
  // Mutations
  const { addClassroom, recordAttendance } = useSchoolMutations();


  // Localized form & selection states
  // For Admin:
  const [className, setClassName] = useState("");
  const [classSubjectIds, setClassSubjectIds] = useState<string[]>([]);

  // For Teacher:
  const [selectedClassId, setSelectedClassId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceStates, setAttendanceStates] = useState<Record<string, AttendanceStatus>>({});

  // Modal display states
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Esc key & body scroll lock listener for modern modal UX
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsClassModalOpen(false);
      }
    };
    if (isClassModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isClassModalOpen]);

  const isLoading = studentsLoading || classroomsLoading || subjectsLoading || teachersLoading;

  if (!currentUser) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#256ff1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const role = currentUser.role;

  // Resolvers
  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || "No Subject";

  // -------------------------------------------------------------
  // RENDER: SUPER-ADMIN & ADMIN (Classes & Language Levels)
  // -------------------------------------------------------------
  if (role === "super-admin" || role === "admin") {
    const handleAddClass = (e: React.FormEvent) => {
      e.preventDefault();
      if (!className || classSubjectIds.length === 0) return;
      
      addClassroom.mutate({
        name: className,
        subjectIds: classSubjectIds
      }, {
        onSuccess: () => {
          setClassName("");
          setClassSubjectIds([]);
          setIsClassModalOpen(false);
          alert("Language level classroom successfully created!");
        }
      });
    };

    const handleSubjectCheckbox = (id: string) => {
      setClassSubjectIds(prev => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    };

    return (
      <div className="space-y-6 animate-fade-in w-full">
        <PageHeader 
          title="Classes & Modules" 
          description="Configure language acquisition levels, designate classes, and assign course subjects."
          actionButton={{
            text: "Create Class",
            icon: <FaSchool size={12} />,
            onClick: () => setIsClassModalOpen(true)
          }}
        />

        {/* Class Cohort Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Active Classrooms"
            total={classrooms.length}
            iconName="FiHome"
            color="text-[#256ff1]"
            description="Active level cohorts"
          />
          <StatsCard
            title="Active Subjects"
            total={subjects.length}
            iconName="FiBriefcase"
            color="text-indigo-500"
            description="Language courses taught"
          />
          <StatsCard
            title="Average Class Size"
            total={classrooms.length > 0 ? (students.length / classrooms.length).toFixed(1) : "0"}
            iconName="FiUsers"
            color="text-emerald-500"
            description="Average density per level"
          />
          <StatsCard
            title="Instruction Coverage"
            total={`${classrooms.filter(c => c.teacherId).length} / ${classrooms.length}`}
            iconName="FiCheckCircle"
            color="text-amber-500"
            description="Assigned instructor rate"
          />
        </div>

        {/* Classes List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-100 mb-4">Classes & Language Levels</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {classrooms.map(c => (
              <div key={c.id} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-850/40 hover:bg-slate-50/60 dark:hover:bg-slate-850/80 hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex justify-between items-start">
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base leading-tight">{c.name}</h3>
                  <span className="text-[10px] bg-[#256ff1]/10 text-[#256ff1] px-2.5 py-1 rounded-full font-bold font-mono tracking-wider uppercase">
                    LEVEL
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 flex items-center gap-1.5 font-medium">
                  Assigned Instructor: <span className="font-bold text-slate-700 dark:text-slate-350">{teachers.find(t => t.id === c.teacherId)?.name || "Unassigned"}</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                  Enrolled Students: <span className="font-bold text-[#256ff1]">{students.filter(s => s.classroomId === c.id).length} learners</span>
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                  {c.subjectIds.map(subId => (
                    <span key={subId} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-lg uppercase tracking-wide">
                      {getSubjectName(subId)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Class Modal with premium aesthetics & backdrop blur (rendered via Portal) */}
        {isClassModalOpen && mounted && createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Backdrop with soft blur */}
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
              onClick={() => setIsClassModalOpen(false)}
            />
            
            {/* Form Container */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm shadow-slate-100/10 dark:shadow-none transition-all duration-300 transform scale-100 z-10 animate-scale-up">
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setIsClassModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <FaTimes size={16} />
              </button>

              <div className="flex items-center gap-2 mb-4 text-[#256ff1]">
                <FaSchool size={18} />
                <h2 className="text-base font-extrabold text-slate-950 dark:text-slate-100">Create Language Level</h2>
              </div>
              
              <form onSubmit={handleAddClass} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Classroom Designation</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. German B1 - Compact"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-4 py-3 backdrop-blur-md border-2 border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 dark:text-slate-200 placeholder-slate-400 bg-white"
                    style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Assign Course Modules</label>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50/20 dark:bg-slate-850/20">
                    {subjects.map(s => (
                      <label key={s.id} className="flex items-center gap-2.5 text-xs font-bold cursor-pointer text-slate-650 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={classSubjectIds.includes(s.id)}
                          onChange={() => handleSubjectCheckbox(s.id)}
                          className="rounded border-slate-300 dark:border-slate-700 text-[#256ff1] focus:ring-[#256ff1] h-4 w-4 cursor-pointer"
                        />
                        {s.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsClassModalOpen(false)}
                    className="w-1/3 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={addClassroom.isPending}
                    className="w-2/3 bg-[#256ff1] hover:bg-blue-600 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl 
                      transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]
                      cursor-pointer shadow-sm hover:shadow-md shadow-[#256ff1]/30 text-center text-sm flex items-center justify-center gap-2"
                  >
                    {addClassroom.isPending ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Classroom Level"
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
  // RENDER: TEACHER (Attendance Tracker)
  // -------------------------------------------------------------
  if (role === "teacher") {
    // Filter classrooms taught by this teacher
    const myClasses = classrooms.filter(c => c.teacherId === currentUser.id);
    const classStudents = students.filter(s => s.classroomId === selectedClassId);

    const handleClassSelect = (classId: string) => {
      setSelectedClassId(classId);
      const initialStates: Record<string, AttendanceStatus> = {};
      students.filter(s => s.classroomId === classId).forEach(s => {
        initialStates[s.id] = "Present";
      });
      setAttendanceStates(initialStates);
    };

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
      setAttendanceStates(prev => ({
        ...prev,
        [studentId]: status
      }));
    };

    const handleSaveAttendance = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedClassId || !attendanceDate) return;

      const records = Object.keys(attendanceStates).map(studentId => ({
        studentId,
        status: attendanceStates[studentId]
      }));

      recordAttendance.mutate({
        classroomId: selectedClassId,
        date: attendanceDate,
        records
      }, {
        onSuccess: () => {
          alert("Attendance roster successfully logged for this class session!");
        }
      });
    };

    return (
      <div className="space-y-6 animate-fade-in w-full">
        <PageHeader 
          title="Attendance Tracker" 
          description="Log and manage student daily attendance checklists and course session histories."
        />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Class Selector Panel */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm h-fit space-y-4">
            <h2 className="text-base font-extrabold text-slate-950 dark:text-slate-100 mb-2">Class Session Settings</h2>
            
            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-1">Select Course Classroom</label>
              <CustomSelect
                options={myClasses.map(c => ({ value: c.id, label: c.name }))}
                value={selectedClassId}
                onChange={handleClassSelect}
                placeholder="Choose class..."
                buttonClassName="!border-2 !border-gray-200 dark:!border-slate-800 !rounded-xl hover:!border-[#256ff1]/60 transition-all !text-slate-800 dark:!text-slate-200 font-semibold"
                style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-1">Session Date</label>
              <input 
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100 outline-none focus:border-[#256ff1] focus:ring-1 focus:ring-[#256ff1]/10 transition-all font-semibold text-slate-700 dark:text-slate-350"
              />
            </div>
          </div>

          {/* Attendance Checkbox List */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-[#256ff1]">
              <FaUserCheck size={18} />
              <h2 className="text-lg font-black text-slate-950 dark:text-slate-100">Daily Attendance Checklist</h2>
            </div>

            {selectedClassId ? (
              <form onSubmit={handleSaveAttendance} className="space-y-6">
                <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-850/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                        <th className="p-3.5">Student Name</th>
                        <th className="p-3.5 text-center">Present</th>
                        <th className="p-3.5 text-center">Late</th>
                        <th className="p-3.5 text-center">Absent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {classStudents.map(student => (
                        <tr key={student.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/20 transition-colors">
                          <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">{student.name}</td>
                          <td className="p-3.5 text-center">
                            <label className="inline-flex items-center justify-center p-1.5 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/20 cursor-pointer transition-colors">
                              <input 
                                type="radio" 
                                name={`attendance-${student.id}`} 
                                checked={attendanceStates[student.id] === "Present"}
                                onChange={() => handleStatusChange(student.id, "Present")}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                              />
                            </label>
                          </td>
                          <td className="p-3.5 text-center">
                            <label className="inline-flex items-center justify-center p-1.5 rounded-full hover:bg-amber-50 dark:hover:bg-amber-950/20 cursor-pointer transition-colors">
                              <input 
                                type="radio" 
                                name={`attendance-${student.id}`} 
                                checked={attendanceStates[student.id] === "Late"}
                                onChange={() => handleStatusChange(student.id, "Late")}
                                className="w-4 h-4 text-amber-500 focus:ring-amber-400 cursor-pointer accent-amber-500"
                              />
                            </label>
                          </td>
                          <td className="p-3.5 text-center">
                            <label className="inline-flex items-center justify-center p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors">
                              <input 
                                type="radio" 
                                name={`attendance-${student.id}`} 
                                checked={attendanceStates[student.id] === "Absent"}
                                onChange={() => handleStatusChange(student.id, "Absent")}
                                className="w-4 h-4 text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-500"
                              />
                            </label>
                          </td>
                        </tr>
                      ))}
                      {classStudents.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-400 dark:text-slate-500 font-medium">
                            No students are currently enrolled in this class group.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {classStudents.length > 0 && (
                  <button 
                    type="submit" 
                    disabled={recordAttendance.isPending}
                    className="px-5 py-2.5 bg-[#256ff1] hover:bg-blue-600 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md shadow-[#256ff1]/10 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {recordAttendance.isPending ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Lock Attendance Roster"
                    )}
                  </button>
                )}
              </form>
            ) : (
              <div className="text-center py-16">
                <p className="text-slate-400 dark:text-slate-500 font-medium">
                  Please select a course classroom from the left configuration panel to populate the attendance register.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: STUDENT (Class Timetable)
  // -------------------------------------------------------------
  if (role === "student") {
    const studentProfile = students.find(s => s.id === currentUser.id);
    const classroom = classrooms.find(c => c.id === studentProfile?.classroomId);

    return (
      <div className="space-y-6 animate-fade-in w-full">
        <PageHeader 
          title="Class Timetable" 
          description="Check your weekly course modules, lesson timetables, and instructor schedules."
        />
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-[#256ff1]">
            <FaCalendarAlt size={18} />
            <h2 className="text-lg font-black text-slate-950 dark:text-slate-100">Weekly Class Timetable</h2>
          </div>
        
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
              <div key={day} className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/40 dark:bg-slate-850/20 hover:bg-slate-50/80 dark:hover:bg-slate-850/40 transition-all duration-300">
                <span className="font-extrabold text-[#256ff1] text-xs uppercase tracking-wider block mb-3">{day}</span>
                <div className="space-y-2.5">
                  <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm">
                    <p className="font-bold text-[10px] text-slate-400 dark:text-slate-500">09:00 AM</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
                      {getSubjectName(classroom?.subjectIds[0] || "German Study")}
                    </p>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm">
                    <p className="font-bold text-[10px] text-slate-400 dark:text-slate-500">10:45 AM</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
                      {getSubjectName(classroom?.subjectIds[1] || "Linguistic Practice")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
