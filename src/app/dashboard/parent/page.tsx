"use client";

import React, { useState, useEffect } from "react";
import { useSchool } from "@/context/SchoolContext";
import { PaymentModal } from "@/components/PaymentModal";

export default function ParentPage() {
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

  // Find linked children
  const myChildren = students.filter(
    s => s.parentEmail && s.parentEmail.toLowerCase() === currentUser?.email.toLowerCase()
  );

  const [selectedChildId, setSelectedChildId] = useState("");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Initialize selected child
  useEffect(() => {
    if (myChildren.length > 0 && !selectedChildId) {
      setSelectedChildId(myChildren[0].id);
    }
  }, [myChildren, selectedChildId]);

  if (!currentUser || currentUser.role !== "parent") {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl border border-rose-100 dark:border-rose-900/30">
        <h2 className="font-bold text-lg">Kein Zugriff</h2>
        <p className="text-sm mt-1">Diese Seite ist nur für Elternteile zugänglich.</p>
      </div>
    );
  }

  const selectedChild = students.find(s => s.id === selectedChildId);
  const childClassroom = classrooms.find(c => c.id === selectedChild?.classroomId);

  // Filter child data
  const childGrades = grades.filter(g => g.studentId === selectedChildId);
  const childAttendance = attendance.filter(a => a.studentId === selectedChildId);
  const childInvoices = invoices.filter(i => i.studentId === selectedChildId);

  // Calculate metrics
  const avgGrade = childGrades.length > 0 
    ? Math.round(childGrades.reduce((sum, g) => sum + g.score, 0) / childGrades.length) 
    : 0;

  const totalClasses = childAttendance.length;
  const presentClasses = childAttendance.filter(a => a.status === "Present" || a.status === "Late").length;
  const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 100;

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || id;

  const handlePayClick = (inv: any) => {
    setSelectedInvoice(inv);
    setPaymentModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Child Selector Dropdown */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl gap-4">
        <div>
          <h2 className="font-bold text-slate-800 dark:text-slate-100">Kind auswählen</h2>
          <p className="text-xs text-slate-500">Berichte und Finanzen des Kindes filtern.</p>
        </div>
        <select 
          value={selectedChildId}
          onChange={(e) => setSelectedChildId(e.target.value)}
          className="px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-semibold text-slate-750 dark:text-slate-200"
        >
          {myChildren.map(child => (
            <option key={child.id} value={child.id}>{child.name}</option>
          ))}
          {myChildren.length === 0 && (
            <option value="">Keine Kinder verknüpft</option>
          )}
        </select>
      </div>

      {selectedChildId ? (
        <>
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <>
              {/* Quick Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Notendurchschnitt</span>
                  <span className="text-3xl font-black text-brand-indigo-600 dark:text-brand-indigo-400 mt-2 block">{avgGrade ? `${avgGrade} %` : "-"}</span>
                  <p className="text-xs text-slate-550 dark:text-slate-400 mt-2">Leistungsstand in schriftlichen Prüfungen.</p>
                </div>
                <div className="glass-card">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Teilnahmequote</span>
                  <span className={`text-3xl font-black mt-2 block ${attendanceRate >= 85 ? "text-emerald-500" : "text-amber-500"}`}>{attendanceRate} %</span>
                  <p className="text-xs text-slate-550 dark:text-slate-400 mt-2">Aufgezeichnet an {totalClasses} Terminen.</p>
                </div>
                <div className="glass-card">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Klassenniveau</span>
                  <span className="text-base font-bold text-slate-800 dark:text-slate-100 mt-2 block truncate">{childClassroom?.name || "Nicht zugewiesen"}</span>
                  <p className="text-xs text-slate-550 dark:text-slate-400 mt-2">Laufender Kurs des Kindes.</p>
                </div>
              </div>

              {/* Status Info */}
              <div className="glass-panel p-6">
                <h3 className="text-base font-extrabold mb-2">Akademischer Gesamtstatus</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {selectedChild?.name} nimmt am Unterricht der Stufe <span className="font-bold text-slate-700 dark:text-slate-200">{childClassroom?.name}</span> teil. Bei offenen Rechnungsbeträgen haben Sie als gesetzlicher Vertreter die Möglichkeit, diese direkt im Menüpunkt "Rechnungen & Zahlung" online zu begleichen.
                </p>
              </div>
            </>
          )}

          {/* Grades Tab */}
          {activeTab === "grades" && (
            <div className="glass-panel p-6">
              <h2 className="text-lg font-black mb-4">Notenberichte für {selectedChild?.name}</h2>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-850">
                      <th className="p-3">Prüfungsdatum</th>
                      <th className="p-3">Unterrichtsfach</th>
                      <th className="p-3">Graduiert durch</th>
                      <th className="p-3 text-right">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {childGrades.map(g => (
                      <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="p-3 font-mono text-slate-500 text-xs">{g.date}</td>
                        <td className="p-3 font-semibold">{getSubjectName(g.subjectId)}</td>
                        <td className="p-3 text-slate-550 dark:text-slate-450">{g.gradedBy}</td>
                        <td className="p-3 text-right font-mono font-bold text-brand-indigo-650 dark:text-brand-indigo-400">{g.score} %</td>
                      </tr>
                    ))}
                    {childGrades.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">Es sind noch keine Zensuren eingetragen.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === "attendance" && (
            <div className="glass-panel p-6">
              <h2 className="text-lg font-black mb-4">Anwesenheitsverlauf von {selectedChild?.name}</h2>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-850">
                      <th className="p-3">Kurstermin</th>
                      <th className="p-3">Klassenraum</th>
                      <th className="p-3 text-right">Anwesenheitsstatus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {childAttendance.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="p-3 font-mono text-slate-500 text-xs">{a.date}</td>
                        <td className="p-3 font-semibold">{childClassroom?.name || "Sprachkurs"}</td>
                        <td className="p-3 text-right">
                          {a.status === "Present" && (
                            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 rounded text-[10px] font-bold">Anwesend</span>
                          )}
                          {a.status === "Late" && (
                            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 rounded text-[10px] font-bold">Verspätet</span>
                          )}
                          {a.status === "Absent" && (
                            <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 rounded text-[10px] font-bold">Fehlzeit</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {childAttendance.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-slate-400">Keine Anwesenheitsdaten vorhanden.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              {/* Unpaid */}
              <div className="glass-panel p-6">
                <h2 className="text-lg font-black mb-4">Offene Schulgeldzahlungen ({selectedChild?.name})</h2>
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
                      {childInvoices.filter(i => i.status === "Unpaid").map(inv => (
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
                      {childInvoices.filter(i => i.status === "Unpaid").length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400">Keine ausstehenden Rechnungen für dieses Kind gefunden. Vielen Dank!</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payments History */}
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
                        return inv?.studentId === selectedChildId;
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
                        return inv?.studentId === selectedChildId;
                      }).length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400">Keine verzeichneten Zahlungen vorhanden.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-slate-400 text-center py-12">Keine verknüpften Schüler vorhanden.</p>
      )}

      {/* Checkout Modal */}
      <PaymentModal 
        isOpen={paymentModalOpen} 
        onClose={() => setPaymentModalOpen(false)} 
        invoice={selectedInvoice}
        onPaymentSuccess={payInvoice}
      />
    </div>
  );
}
