"use client";

import React, { useState } from "react";
import { useSchool } from "@/context/SchoolContext";
import { PaymentModal } from "@/components/PaymentModal";

export default function StudentPage() {
  const {
    currentUser,
    activeTab,
    students,
    classrooms,
    subjects,
    grades,
    attendance,
    invoices,
    payments,
    payInvoice
  } = useSchool();

  // Payment states
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  if (!currentUser || currentUser.role !== "student") {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl border border-rose-100 dark:border-rose-900/30">
        <h2 className="font-bold text-lg">Kein Zugriff</h2>
        <p className="text-sm mt-1">Diese Seite ist nur für Schüler zugänglich.</p>
      </div>
    );
  }

  // Get student profile
  const profile = students.find(s => s.id === currentUser.id);
  const classroom = classrooms.find(c => c.id === profile?.classroomId);

  // Student specific data
  const myGrades = grades.filter(g => g.studentId === currentUser.id);
  const myAttendance = attendance.filter(a => a.studentId === currentUser.id);
  const myInvoices = invoices.filter(i => i.studentId === currentUser.id);

  // Math metrics
  const avgGrade = myGrades.length > 0 
    ? Math.round(myGrades.reduce((sum, g) => sum + g.score, 0) / myGrades.length) 
    : 0;

  const totalClasses = myAttendance.length;
  const presentClasses = myAttendance.filter(a => a.status === "Present" || a.status === "Late").length;
  const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 100;

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || id;

  const handlePayClick = (inv: any) => {
    setSelectedInvoice(inv);
    setPaymentModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Mein Notendurchschnitt</span>
              <span className="text-3xl font-black text-brand-indigo-600 dark:text-brand-indigo-400 mt-2 block">{avgGrade ? `${avgGrade} %` : "-"}</span>
              <p className="text-xs text-slate-500 mt-2">Durchschnitt aller Fachprüfungen.</p>
            </div>
            <div className="glass-card">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Anwesenheitsquote</span>
              <span className={`text-3xl font-black mt-2 block ${attendanceRate >= 85 ? "text-emerald-500" : "text-amber-500"}`}>{attendanceRate} %</span>
              <p className="text-xs text-slate-500 mt-2">Berechnet aus {totalClasses} Kurstagen.</p>
            </div>
            <div className="glass-card">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Mein Sprachkurs</span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-100 mt-2 block truncate">{classroom?.name || "Keiner Klasse zugewiesen"}</span>
              <p className="text-xs text-slate-500 mt-2">Aktuelle Lerngruppe am Institut.</p>
            </div>
          </div>

          {/* Timetable Card */}
          <div className="glass-panel p-6">
            <h2 className="text-base font-extrabold mb-4">Heutiger Stundenplan</h2>
            {classroom ? (
              <div className="space-y-3">
                {classroom.subjectIds.map((subId, index) => (
                  <div key={subId} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-brand-indigo-50 dark:bg-brand-indigo-500/10 text-brand-indigo-600 dark:text-brand-indigo-400 flex items-center justify-center font-bold font-mono text-xs">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="font-semibold text-sm">{getSubjectName(subId)}</h4>
                        <span className="text-[10px] text-slate-400">Dozent: Herr Weber/Frau Wagner</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-500">{index === 0 ? "09:00 - 10:30" : index === 1 ? "10:45 - 12:15" : "13:00 - 14:30"} Uhr</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-6">Kein Stundenplan verfügbar.</p>
            )}
          </div>
        </>
      )}

      {/* Grades Tab */}
      {activeTab === "grades" && (
        <div className="glass-panel p-6">
          <h2 className="text-lg font-black mb-4">Mein Zensurenspiegel</h2>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-850">
                  <th className="p-3">Prüfungsdatum</th>
                  <th className="p-3">Fachbereich</th>
                  <th className="p-3">Prüfer/in</th>
                  <th className="p-3 text-right">Ergebnis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {myGrades.map(g => (
                  <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="p-3 font-mono text-slate-500 text-xs">{g.date}</td>
                    <td className="p-3 font-semibold">{getSubjectName(g.subjectId)}</td>
                    <td className="p-3 text-slate-550 dark:text-slate-450">{g.gradedBy}</td>
                    <td className="p-3 text-right font-mono font-bold text-brand-indigo-650 dark:text-brand-indigo-400">{g.score} %</td>
                  </tr>
                ))}
                {myGrades.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-400">Es wurden noch keine Noten eingetragen.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Timetable Tab */}
      {activeTab === "timetable" && (
        <div className="glass-panel p-6">
          <h2 className="text-lg font-black mb-4">Wochenstundenplan ({classroom?.name})</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"].map((day, i) => (
              <div key={day} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                <span className="font-bold text-brand-indigo-600 dark:text-brand-indigo-400 text-xs uppercase tracking-wider">{day}</span>
                <div className="mt-3 space-y-2">
                  <div className="p-2 bg-white dark:bg-slate-850 rounded border border-slate-150/40 dark:border-slate-800">
                    <p className="font-semibold text-xs">09:00 Uhr</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">{getSubjectName(classroom?.subjectIds[0] || "")}</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-850 rounded border border-slate-150/40 dark:border-slate-800">
                    <p className="font-semibold text-xs">10:45 Uhr</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">{getSubjectName(classroom?.subjectIds[1] || "")}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === "billing" && (
        <div className="space-y-6 animate-fade">
          {/* Unpaid */}
          <div className="glass-panel p-6">
            <h2 className="text-lg font-black mb-4">Offene Kursrechnungen</h2>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-850">
                    <th className="p-3">Rechnungsnummer</th>
                    <th className="p-3">Beschreibung</th>
                    <th className="p-3">Fälligkeit</th>
                    <th className="p-3">Betrag</th>
                    <th className="p-3 text-right">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {myInvoices.filter(i => i.status === "Unpaid").map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="p-3 font-mono font-semibold">{inv.id}</td>
                      <td className="p-3 text-slate-650 dark:text-slate-350">{inv.description}</td>
                      <td className="p-3 text-rose-500 font-semibold">{inv.dueDate}</td>
                      <td className="p-3 font-mono font-bold">{inv.amount.toFixed(2)} €</td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => handlePayClick(inv)}
                          className="px-4 py-1.5 text-xs font-extrabold bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white rounded-lg cursor-pointer transition-colors shadow shadow-brand-indigo-500/10"
                        >
                          Jetzt bezahlen
                        </button>
                      </td>
                    </tr>
                  ))}
                  {myInvoices.filter(i => i.status === "Unpaid").length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400">Keine offenen Rechnungen gefunden. Vielen Dank!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paid History */}
          <div className="glass-panel p-6">
            <h2 className="text-lg font-black mb-4">Bezahlte Rechnungen (Verlauf)</h2>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-850">
                    <th className="p-3">Zahlungs-ID</th>
                    <th className="p-3">Beschreibung</th>
                    <th className="p-3">Datum</th>
                    <th className="p-3 text-right">Zahlungssumme</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                  {payments.filter(p => {
                    const inv = invoices.find(i => i.id === p.invoiceId);
                    return inv?.studentId === currentUser.id;
                  }).map(p => {
                    const inv = invoices.find(i => i.id === p.invoiceId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="p-3 font-mono text-slate-500">{p.id}</td>
                        <td className="p-3 font-semibold text-slate-700 dark:text-slate-350">{inv?.description || p.invoiceId}</td>
                        <td className="p-3 font-mono text-slate-500">{p.date}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-450">+{p.amount.toFixed(2)} €</td>
                      </tr>
                    );
                  })}
                  {payments.filter(p => {
                    const inv = invoices.find(i => i.id === p.invoiceId);
                    return inv?.studentId === currentUser.id;
                  }).length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400">Keine Zahlungen im Zahlungsverlauf registriert.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payment simulated checkout overlay */}
      <PaymentModal 
        isOpen={paymentModalOpen} 
        onClose={() => setPaymentModalOpen(false)} 
        invoice={selectedInvoice}
        onPaymentSuccess={payInvoice}
      />
    </div>
  );
}
