"use client";

import React, { useState } from "react";
import { useSchool, AttendanceStatus } from "@/context/SchoolContext";

export default function TeacherPage() {
  const {
    currentUser,
    activeTab,
    students,
    classrooms,
    subjects,
    grades,
    attendance,
    recordGrade,
    recordAttendance
  } = useSchool();

  // Selected class for actions
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceStates, setAttendanceStates] = useState<Record<string, AttendanceStatus>>({});

  // Grading states
  const [gradeStudentId, setGradeStudentId] = useState("");
  const [gradeScore, setGradeScore] = useState("");
  const [gradeSubjectId, setGradeSubjectId] = useState("");

  if (!currentUser || currentUser.role !== "teacher") {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl border border-rose-100 dark:border-rose-900/30">
        <h2 className="font-bold text-lg">Kein Zugriff</h2>
        <p className="text-sm mt-1">Diese Seite ist nur für Lehrkräfte zugänglich.</p>
      </div>
    );
  }

  // Filter classrooms taught by this teacher
  const myClasses = classrooms.filter(c => c.teacherId === currentUser.id);

  // Filter students in the selected class
  const classStudents = students.filter(s => s.classroomId === selectedClassId);

  // Load students for attendance checklist
  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
    // Initialize attendance status to 'Present' for all students in that class
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

    recordAttendance(selectedClassId, attendanceDate, records);
    alert("Anwesenheit erfolgreich gespeichert!");
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !gradeStudentId || !gradeSubjectId || !gradeScore) return;

    recordGrade(gradeStudentId, selectedClassId, gradeSubjectId, parseInt(gradeScore));
    setGradeStudentId("");
    setGradeScore("");
    setGradeSubjectId("");
    alert("Note erfolgreich eingetragen!");
  };

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || id;
  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || id;

  return (
    <div className="space-y-6">
      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Welcome Info */}
          <div className="glass-card">
            <h2 className="text-lg font-black">Willkommen zurück, {currentUser.name}!</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Hier sehen Sie Ihre zugeordneten Sprachkurse im laufenden Semester.</p>
          </div>

          {/* Classes Taught list */}
          <div className="glass-panel p-6">
            <h3 className="text-base font-extrabold mb-4">Meine Kurse</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myClasses.map(c => (
                <div key={c.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">{c.name}</h4>
                  <p className="text-xs text-slate-500 mt-2">
                    Eingeschriebene Schüler: <span className="font-bold text-slate-700 dark:text-slate-200">{students.filter(s => s.classroomId === c.id).length}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.subjectIds.map(subId => (
                      <span key={subId} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] rounded font-medium">
                        {getSubjectName(subId)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {myClasses.length === 0 && (
                <p className="text-slate-450 dark:text-slate-500 text-sm">Ihnen sind zurzeit keine Klassen zugeordnet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === "attendance" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Class Selectors */}
          <div className="lg:col-span-4 glass-card h-fit space-y-4">
            <h2 className="text-base font-extrabold mb-2">Klasse & Datum wählen</h2>
            <div>
              <label className="text-xs font-bold text-slate-550 dark:text-slate-400 block mb-1">Kurs auswählen</label>
              <select 
                value={selectedClassId}
                onChange={(e) => handleClassSelect(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
              >
                <option value="">Kurs wählen...</option>
                {myClasses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-550 dark:text-slate-400 block mb-1">Datum</label>
              <input 
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
              />
            </div>
          </div>

          {/* Attendance List */}
          <div className="lg:col-span-8 glass-panel p-6">
            <h2 className="text-lg font-bold mb-4 font-black">Anwesenheitsliste</h2>
            {selectedClassId ? (
              <form onSubmit={handleSaveAttendance} className="space-y-6">
                <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-850">
                        <th className="p-3">Name</th>
                        <th className="p-3 text-center">Anwesend</th>
                        <th className="p-3 text-center">Verspätet</th>
                        <th className="p-3 text-center">Abwesend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {classStudents.map(student => (
                        <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                          <td className="p-3 font-semibold">{student.name}</td>
                          <td className="p-3 text-center">
                            <input 
                              type="radio" 
                              name={`attendance-${student.id}`} 
                              checked={attendanceStates[student.id] === "Present"}
                              onChange={() => handleStatusChange(student.id, "Present")}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input 
                              type="radio" 
                              name={`attendance-${student.id}`} 
                              checked={attendanceStates[student.id] === "Late"}
                              onChange={() => handleStatusChange(student.id, "Late")}
                              className="w-4 h-4 text-amber-500 focus:ring-amber-400 cursor-pointer"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input 
                              type="radio" 
                              name={`attendance-${student.id}`} 
                              checked={attendanceStates[student.id] === "Absent"}
                              onChange={() => handleStatusChange(student.id, "Absent")}
                              className="w-4 h-4 text-rose-600 focus:ring-rose-500 cursor-pointer"
                            />
                          </td>
                        </tr>
                      ))}
                      {classStudents.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400">Keine Schüler in dieser Klasse eingeschrieben.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {classStudents.length > 0 && (
                  <button 
                    type="submit" 
                    className="px-5 py-2.5 bg-brand-green-500 hover:bg-brand-green-600 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-lg shadow-brand-green-500/10"
                  >
                    Anwesenheit verbuchen
                  </button>
                )}
              </form>
            ) : (
              <p className="text-slate-400 text-center py-12">Bitte wählen Sie links eine Klasse aus, um die Anwesenheit zu laden.</p>
            )}
          </div>
        </div>
      )}

      {/* Grades Tab */}
      {activeTab === "grades" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Grading Form */}
          <div className="lg:col-span-5 glass-card h-fit">
            <h2 className="text-base font-extrabold mb-4">Note vergeben</h2>
            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 block mb-1">Klasse wählen</label>
                <select 
                  required 
                  value={selectedClassId}
                  onChange={(e) => handleClassSelect(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                >
                  <option value="">Klasse wählen...</option>
                  {myClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 block mb-1">Schüler/in wählen</label>
                <select 
                  required 
                  disabled={!selectedClassId}
                  value={gradeStudentId}
                  onChange={(e) => setGradeStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none disabled:opacity-50"
                >
                  <option value="">Schüler wählen...</option>
                  {classStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 block mb-1">Fach auswählen</label>
                <select 
                  required 
                  disabled={!selectedClassId}
                  value={gradeSubjectId}
                  onChange={(e) => setGradeSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none disabled:opacity-50"
                >
                  <option value="">Fach wählen...</option>
                  {selectedClassId && classrooms.find(c => c.id === selectedClassId)?.subjectIds.map(subId => (
                    <option key={subId} value={subId}>{getSubjectName(subId)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 block mb-1">Ergebnis (0–100 %)</label>
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  required 
                  placeholder="z.B. 88"
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                />
              </div>

              <button 
                type="submit" 
                disabled={!selectedClassId || !gradeStudentId || !gradeSubjectId || !gradeScore}
                className="w-full py-2.5 bg-brand-indigo-650 hover:bg-brand-indigo-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors disabled:opacity-50"
              >
                Note eintragen
              </button>
            </form>
          </div>

          {/* Recent Grades List */}
          <div className="lg:col-span-7 glass-panel p-6">
            <h2 className="text-lg font-bold mb-4 font-black">Zuletzt vergebene Noten</h2>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-850">
                    <th className="p-3">Datum</th>
                    <th className="p-3">Schüler</th>
                    <th className="p-3">Fach</th>
                    <th className="p-3 text-right">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                  {grades.map(g => (
                    <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="p-3 font-mono text-slate-500">{g.date}</td>
                      <td className="p-3 font-semibold">{getStudentName(g.studentId)}</td>
                      <td className="p-3 text-slate-650 dark:text-slate-350">{getSubjectName(g.subjectId)}</td>
                      <td className="p-3 text-right font-mono font-bold text-brand-indigo-600 dark:text-brand-indigo-400">{g.score} %</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
