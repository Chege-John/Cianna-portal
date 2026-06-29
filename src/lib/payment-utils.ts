import { Invoice, StudentProfile } from "@/context/SchoolContext";

export interface PaymentAlert {
  invoiceId: string;
  studentId: string;
  studentName: string;
  courseLevel: string;
  amount: number;
  paidAmount: number;
  balance: number;
  daysElapsed: number;
  severity: "low" | "medium" | "high";
  message: string;
}

export function getPaymentAlerts(invoices: Invoice[], students: StudentProfile[]): PaymentAlert[] {
  const alerts: PaymentAlert[] = [];
  const now = new Date();

  invoices.forEach(invoice => {
    if (invoice.status === "Paid") return;

    const student = students.find(s => s.id === invoice.studentId);
    if (!student) return;

    const createdAt = new Date(invoice.createdAt);
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const daysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const balance = invoice.amount - (invoice.paidAmount || 0);
    if (balance <= 0) return;

    const courseLevel = student.courseLevel;
    let shouldAlert = false;
    let message = "";
    let severity: "low" | "medium" | "high" = "low";

    if (courseLevel === "A1" || courseLevel === "A2") {
      // A1/A2 (30k): 8 weeks. Alert halfway (4 weeks / 28 days)
      if (daysElapsed >= 28) {
        shouldAlert = true;
        severity = daysElapsed >= 42 ? "high" : "medium"; // High alert after 6 weeks
        message = `Halfway through ${courseLevel} course. Balance of ${balance.toLocaleString()} KSh remains.`;
      }
    } else if (courseLevel === "B1" || courseLevel === "B2") {
      // B1/B2 (35k): 3 months. Alert halfway (1.5 months / 45 days)
      if (daysElapsed >= 45) {
        shouldAlert = true;
        severity = daysElapsed >= 75 ? "high" : "medium"; // High alert after 2.5 months
        message = `Halfway through ${courseLevel} course. Balance of ${balance.toLocaleString()} KSh remains.`;
      }
    }

    if (shouldAlert) {
      alerts.push({
        invoiceId: invoice.id,
        studentId: student.id,
        studentName: student.name,
        courseLevel: courseLevel,
        amount: invoice.amount,
        paidAmount: invoice.paidAmount || 0,
        balance: balance,
        daysElapsed: daysElapsed,
        severity: severity,
        message: message
      });
    }
  });

  return alerts.sort((a, b) => {
    // Sort by severity (high first) then by daysElapsed
    const severityMap = { high: 3, medium: 2, low: 1 };
    if (severityMap[a.severity] !== severityMap[b.severity]) {
      return severityMap[b.severity] - severityMap[a.severity];
    }
    return b.daysElapsed - a.daysElapsed;
  });
}
