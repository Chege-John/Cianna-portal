"use client";

import React, { useState } from "react";
import { useSchool } from "@/context/SchoolContext";
import { InvoiceModal } from "@/components/InvoiceModal";

export default function AdminPage() {
  const {
    currentUser,
    activeTab,
    students,
    teachers,
    classrooms,
    subjects,
    invoices,
    payments,
    addStudent,
    addTeacher,
    addClassroom,
    createInvoice
  } = useSchool();

  // Selected invoice state for modal viewer
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  // Forms states
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentClassId, setStudentClassId] = useState("");
  const [studentParentEmail, setStudentParentEmail] = useState("");

  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherSubjectId, setTeacherSubjectId] = useState("");

  const [className, setClassName] = useState("");
  const [classSubjectIds, setClassSubjectIds] = useState<string[]>([]);

  const [invoiceStudentId, setInvoiceStudentId] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceDesc, setInvoiceDesc] = useState("");

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl border border-rose-100 dark:border-rose-900/30">
        <h2 className="font-bold text-lg">Kein Zugriff</h2>
        <p className="text-sm mt-1">Diese Seite ist nur für Administrationsmitglieder zugänglich.</p>
      </div>
    );
  }

  // Calculate finance metrics
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices.filter(inv => inv.status === "Paid").reduce((sum, inv) => sum + inv.amount, 0);
  const outstanding = invoices.filter(inv => inv.status === "Unpaid").reduce((sum, inv) => sum + inv.amount, 0);

  const getClassroomName = (id: string) => classrooms.find(c => c.id === id)?.name || "Unbekannt";
  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || "Keine Fachrichtung";
  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || "Unbekannter Schüler";

  // Form Submissions
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !studentEmail || !studentClassId) return;
    addStudent(studentName, studentEmail, studentClassId, studentParentEmail || undefined);
    setStudentName("");
    setStudentEmail("");
    setStudentClassId("");
    setStudentParentEmail("");
  };

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName || !teacherEmail || !teacherSubjectId) return;
    addTeacher(teacherName, teacherEmail, teacherSubjectId);
    setTeacherName("");
    setTeacherEmail("");
    setTeacherSubjectId("");
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className || classSubjectIds.length === 0) return;
    addClassroom(className, classSubjectIds);
    setClassName("");
    setClassSubjectIds([]);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceStudentId || !invoiceAmount || !invoiceDesc) return;
    createInvoice(invoiceStudentId, parseFloat(invoiceAmount), invoiceDesc);
    setInvoiceStudentId("");
    setInvoiceAmount("");
    setInvoiceDesc("");
  };

  const handleSubjectCheckbox = (id: string) => {
    setClassSubjectIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Registrierte Schüler</span>
              <span className="text-2xl font-black mt-2 block">{students.length}</span>
              <p className="text-xs text-slate-500 mt-2">Aktiv eingeschriebene Lerner.</p>
            </div>
            <div className="glass-card">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Lehrkräfte</span>
              <span className="text-2xl font-black mt-2 block">{teachers.length}</span>
              <p className="text-xs text-slate-500 mt-2">Dozenten und Tutoren.</p>
            </div>
            <div className="glass-card">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Einnahmen (Bezahlt)</span>
              <span className="text-2xl font-black text-emerald-500 mt-2 block">{totalPaid.toFixed(2)} €</span>
              <p className="text-xs text-slate-550 dark:text-slate-400 mt-2">Erfolgreich verbuchte Kursgebühren.</p>
            </div>
            <div className="glass-card">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Ausstehend</span>
              <span className="text-2xl font-black text-rose-500 mt-2 block">{outstanding.toFixed(2)} €</span>
              <p className="text-xs text-slate-550 dark:text-slate-400 mt-2">Aktuelle offene Kundenforderungen.</p>
            </div>
          </div>

          {/* Quick Stats list / Outstanding Invoices */}
          <div className="glass-panel p-6">
            <h2 className="text-base font-extrabold mb-4">Offene Zahlungen (Rechnungsliste)</h2>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-850">
                    <th className="p-3">Nummer</th>
                    <th className="p-3">Schüler/in</th>
                    <th className="p-3">Verwendungszweck</th>
                    <th className="p-3">Fälligkeit</th>
                    <th className="p-3">Betrag</th>
                    <th className="p-3">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {invoices.filter(i => i.status === "Unpaid").map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="p-3 font-mono font-semibold">{inv.id}</td>
                      <td className="p-3 font-semibold">{getStudentName(inv.studentId)}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-350">{inv.description}</td>
                      <td className="p-3 font-semibold text-rose-500">{inv.dueDate}</td>
                      <td className="p-3 font-mono font-semibold text-brand-indigo-600 dark:text-brand-indigo-400">{inv.amount.toFixed(2)} €</td>
                      <td className="p-3">
                        <button 
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setInvoiceModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded cursor-pointer transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {invoices.filter(i => i.status === "Unpaid").length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-400">Keine ausstehenden Rechnungen vorhanden.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Classrooms Tab */}
      {activeTab === "classrooms" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* List */}
          <div className="lg:col-span-7 glass-panel p-6">
            <h2 className="text-lg font-bold mb-4 font-black">Klassen & Sprachniveaus</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classrooms.map(c => (
                <div key={c.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">{c.name}</h3>
                    <span className="text-[10px] bg-brand-indigo-50 dark:bg-brand-indigo-500/10 text-brand-indigo-600 dark:text-brand-indigo-400 px-2 py-0.5 rounded font-black font-mono">
                      CLASS
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Dozent: <span className="font-semibold">{teachers.find(t => t.id === c.teacherId)?.name || "Nicht zugewiesen"}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.subjectIds.map(subId => (
                      <span key={subId} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] rounded">
                        {getSubjectName(subId)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-5 glass-card h-fit">
            <h2 className="text-base font-extrabold mb-4">Neuen Klassenraum anlegen</h2>
            <form onSubmit={handleAddClass} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 block mb-1">Bezeichnung</label>
                <input 
                  type="text" 
                  required 
                  placeholder="z.B. Deutsch B1 - Kompakt"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 block mb-2">Fächer zuordnen</label>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {subjects.map(s => (
                    <label key={s.id} className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-slate-650 dark:text-slate-350">
                      <input 
                        type="checkbox" 
                        checked={classSubjectIds.includes(s.id)}
                        onChange={() => handleSubjectCheckbox(s.id)}
                        className="rounded text-brand-indigo-600 focus:ring-brand-indigo-500"
                      />
                      {s.name}
                    </label>
                  ))}
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full py-2 bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Klasse erstellen
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === "students" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* List */}
          <div className="lg:col-span-7 glass-panel p-6">
            <h2 className="text-lg font-bold mb-4 font-black">Eingeschriebene Schüler</h2>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-850">
                    <th className="p-3">Name</th>
                    <th className="p-3">E-Mail</th>
                    <th className="p-3">Klasse</th>
                    <th className="p-3">Eltern-Kontakt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {students.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="p-3 font-semibold">{s.name}</td>
                      <td className="p-3 text-slate-500 font-mono text-xs">{s.email}</td>
                      <td className="p-3 font-semibold text-brand-indigo-650 dark:text-brand-indigo-400">{getClassroomName(s.classroomId)}</td>
                      <td className="p-3 text-xs text-slate-500 font-mono">{s.parentEmail || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-5 glass-card h-fit">
            <h2 className="text-base font-extrabold mb-4">Neuen Schüler aufnehmen</h2>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 block mb-1">Vollständiger Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="z.B. Jonas Wagner"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 block mb-1">E-Mail-Adresse</label>
                <input 
                  type="email" 
                  required 
                  placeholder="jonas@student.de"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 block mb-1">Klassenraum zuweisen</label>
                <select 
                  required 
                  value={studentClassId}
                  onChange={(e) => setStudentClassId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                >
                  <option value="">Klasse wählen...</option>
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 block mb-1">E-Mail des Elternteils (optional)</label>
                <input 
                  type="email" 
                  placeholder="parent@mail.de"
                  value={studentParentEmail}
                  onChange={(e) => setStudentParentEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-2 bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Registrierung bestätigen
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Teachers Tab */}
      {activeTab === "teachers" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* List */}
          <div className="lg:col-span-7 glass-panel p-6">
            <h2 className="text-lg font-bold mb-4 font-black">Dozenten & Lehrkräfte</h2>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-850">
                    <th className="p-3">Name</th>
                    <th className="p-3">E-Mail</th>
                    <th className="p-3">Schwerpunkt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {teachers.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="p-3 font-semibold">{t.name}</td>
                      <td className="p-3 text-slate-500 font-mono text-xs">{t.email}</td>
                      <td className="p-3 font-semibold text-brand-green-500">{getSubjectName(t.subjectId)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-5 glass-card h-fit">
            <h2 className="text-base font-extrabold mb-4">Neue Lehrkraft anstellen</h2>
            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 block mb-1">Vollständiger Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="z.B. Dr. Julia Fischer"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 block mb-1">E-Mail-Adresse</label>
                <input 
                  type="email" 
                  required 
                  placeholder="fischer@cianna.de"
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 block mb-1">Spezialisierung / Fach</label>
                <select 
                  required 
                  value={teacherSubjectId}
                  onChange={(e) => setTeacherSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                >
                  <option value="">Fach wählen...</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <button 
                type="submit" 
                className="w-full py-2 bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Dozentenkonto erstellen
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === "billing" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Invoice List & Payment Logs */}
          <div className="lg:col-span-8 space-y-6">
            {/* Invoices */}
            <div className="glass-panel p-6">
              <h2 className="text-lg font-bold mb-4 font-black">Ausgestellte Rechnungen</h2>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-850">
                      <th className="p-3">Nummer</th>
                      <th className="p-3">Schüler</th>
                      <th className="p-3">Beschreibung</th>
                      <th className="p-3">Betrag</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Aktion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="p-3 font-mono font-semibold">{inv.id}</td>
                        <td className="p-3 font-semibold">{getStudentName(inv.studentId)}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-350">{inv.description}</td>
                        <td className="p-3 font-mono font-semibold">{inv.amount.toFixed(2)} €</td>
                        <td className="p-3">
                          {inv.status === "Paid" ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 rounded text-[10px] font-bold">
                              Bezahlt
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 rounded text-[10px] font-bold">
                              Offen
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <button 
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setInvoiceModalOpen(true);
                            }}
                            className="px-2 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded cursor-pointer transition-colors"
                          >
                            Anzeigen
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Logs */}
            <div className="glass-panel p-6">
              <h2 className="text-lg font-bold mb-4 font-black">Zahlungseingänge</h2>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-850">
                      <th className="p-3">Zahlungs-ID</th>
                      <th className="p-3">Rechnung</th>
                      <th className="p-3">Zahlungsart</th>
                      <th className="p-3">Datum</th>
                      <th className="p-3">Betrag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                    {payments.map(p => {
                      const inv = invoices.find(i => i.id === p.invoiceId);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                          <td className="p-3 font-mono text-slate-500">{p.id}</td>
                          <td className="p-3 font-semibold text-slate-650 dark:text-slate-350">{inv?.description || p.invoiceId}</td>
                          <td className="p-3 font-semibold">{p.paymentMethod}</td>
                          <td className="p-3 text-slate-500 font-mono">{p.date}</td>
                          <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">+{p.amount.toFixed(2)} €</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Invoice Creator Form */}
          <div className="lg:col-span-4 glass-card h-fit">
            <h2 className="text-base font-extrabold mb-4">Rechnung erstellen</h2>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 block mb-1">Empfänger (Schüler/in)</label>
                <select 
                  required 
                  value={invoiceStudentId}
                  onChange={(e) => setInvoiceStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                >
                  <option value="">Schüler wählen...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 block mb-1">Rechnungsbetrag (EUR)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required 
                  placeholder="350.00"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 block mb-1">Beschreibung</label>
                <input 
                  type="text" 
                  required 
                  placeholder="z.B. Kursgebühr B2 (Monat Juli)"
                  value={invoiceDesc}
                  onChange={(e) => setInvoiceDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-2.5 bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Rechnung ausstellen
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Viewer Modal */}
      <InvoiceModal 
        isOpen={invoiceModalOpen} 
        onClose={() => setInvoiceModalOpen(false)} 
        invoice={selectedInvoice}
        studentName={selectedInvoice ? getStudentName(selectedInvoice.studentId) : undefined}
      />
    </div>
  );
}
