import React, { useState, useEffect, Suspense } from "react";
import { createPortal } from "react-dom";
import { useSchool, Invoice } from "@/context/SchoolContext";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  useInvoices, 
  usePayments, 
  useStudents, 
  useSchoolMutations 
} from "@/hooks/use-school-data";
import { PageHeader } from "@/components/PageHeader";
import StatsCard from "@/components/StatsCard";
import CustomTable from "@/components/ui/CustomTable";
import CustomSelect from "@/components/ui/CustomSelect";
import { InvoiceModal } from "@/components/InvoiceModal";
import { PaymentModal } from "@/components/PaymentModal";
import { AdminPaymentModal } from "@/components/AdminPaymentModal";
import { getPaymentAlerts } from "@/lib/payment-utils";
import { FiUser, FiDollarSign, FiFileText } from "react-icons/fi";
import { 
  FaFileInvoiceDollar, 
  FaRegCreditCard, 
  FaCheckCircle, 
  FaEye, 
  FaPlus,
  FaTimes,
  FaSpinner
} from "react-icons/fa";

interface PaymentsProps {
  selectedChildId?: string; // Provided by Parent wrapper
}

function PaymentsContent({ selectedChildId }: PaymentsProps) {
  const { currentUser } = useSchool();
  const searchParams = useSearchParams();
  const router = useRouter();
  const filterStudentId = searchParams.get("studentId");
  
  // Data Fetching
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: payments = [], isLoading: paymentsLoading } = usePayments();
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  
  // Mutations
  const { createInvoice, payInvoice } = useSchoolMutations();


  // Localized UI and Search States
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");

  // Create Invoice Form States
  const [invoiceStudentId, setInvoiceStudentId] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceDesc, setInvoiceDesc] = useState("");

  // Modals state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [adminPaymentModalOpen, setAdminPaymentModalOpen] = useState(false);

  // Issue Invoice Modal State
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle cross-link student filtering
  useEffect(() => {
    if (filterStudentId && students.length > 0) {
      const student = students.find(s => s.id === filterStudentId);
      if (student) {
        setInvoiceSearch(student.name);
      }
    }
  }, [filterStudentId, students]);

  // Esc key & body scroll lock listener for modern modal UX
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsIssueModalOpen(false);
      }
    };
    if (isIssueModalOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isIssueModalOpen]);

  if (!currentUser) return null;

  const role = currentUser.role;

  // Resolvers
  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || "Unknown Student";

  // -------------------------------------------------------------
  // RENDER: SUPER-ADMIN & ADMIN (Financial Ledger Management)
  // -------------------------------------------------------------
  if (role === "super-admin" || role === "admin") {
    const isLoading = invoicesLoading || paymentsLoading || studentsLoading;

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-[#256ff1] border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = invoices.filter(inv => inv.status === "Paid").reduce((sum, inv) => sum + inv.amount, 0);
    const outstanding = invoices.filter(inv => inv.status === "Unpaid").reduce((sum, inv) => sum + inv.amount, 0);

    const handleCreateInvoice = (e: React.FormEvent) => {
      e.preventDefault();
      if (!invoiceStudentId || !invoiceAmount || !invoiceDesc) return;
      
      createInvoice.mutate({
        studentId: invoiceStudentId,
        amount: parseFloat(invoiceAmount),
        description: invoiceDesc
      }, {
        onSuccess: () => {
          setInvoiceStudentId("");
          setInvoiceAmount("");
          setInvoiceDesc("");
          setIsIssueModalOpen(false);
          alert("Invoice generated and logged successfully!");
        }
      });
    };

    const filteredInvoices = invoices.filter(inv => 
      getStudentName(inv.studentId).toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.description.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.id.toLowerCase().includes(invoiceSearch.toLowerCase())
    );

    const filteredPayments = payments.filter(p => {
      const inv = invoices.find(i => i.id === p.invoiceId);
      const desc = inv?.description || "";
      return (
        p.id.toLowerCase().includes(paymentSearch.toLowerCase()) ||
        desc.toLowerCase().includes(paymentSearch.toLowerCase()) ||
        p.paymentMethod.toLowerCase().includes(paymentSearch.toLowerCase())
      );
    });

    return (
      <div className="space-y-6 animate-fade-in w-full">
        <PageHeader 
          title={role === "super-admin" ? "Financial Ledger" : "Payments & Invoices"} 
          description={
            role === "super-admin"
              ? "Track school invoices, audit settlements, and manage tuition accounts."
              : "Generate invoices, track transaction histories, and view settled or pending billing."
          }
          actionButton={{
            text: "Issue Invoice",
            icon: <FaFileInvoiceDollar size={12} />,
            onClick: () => setIsIssueModalOpen(true)
          }}
        />

        {/* Financial Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Cumulative Billings"
            total={`${totalInvoiced.toLocaleString()} KSh`}
            iconName="FiCreditCard"
            color="text-[#256ff1]"
            description="Total fees invoiced"
          />
          <StatsCard
            title="Settled Payments"
            total={`${totalPaid.toLocaleString()} KSh`}
            iconName="FiDollarSign"
            color="text-emerald-500"
            description="Successfully paid invoices"
          />
          <StatsCard
            title="Outstanding Balances"
            total={`${outstanding.toLocaleString()} KSh`}
            iconName="FiAlertCircle"
            color="text-rose-500"
            description="Pending school collections"
          />
          <StatsCard
            title="Settlement Rate"
            total={totalInvoiced > 0 ? `${Math.round((totalPaid / totalInvoiced) * 100)} %` : "100 %"}
            iconName="FiCheckCircle"
            color="text-indigo-500"
            description="Completed payment ratio"
          />
        </div>

        <div className="flex flex-col gap-6">
          {/* Invoices List & Successful Settlement Logs */}
          <div className="w-full flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">All Student Invoices</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Historical overview of bills, due dates, and settlement status.</p>
                </div>
                {invoiceSearch && (
                  <button
                    onClick={() => setInvoiceSearch("")}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200/40 dark:border-slate-700/40"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              
              <CustomTable
                data={filteredInvoices}
                searchQuery={invoiceSearch}
                onSearchChange={setInvoiceSearch}
                searchPlaceholder="Search invoices..."
                noun="invoices"
                pageSize={5}
                columns={[
                  {
                    header: "Invoice ID",
                    accessor: (inv) => <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">{inv.id}</span>
                  },
                  {
                    header: "Student",
                    accessor: (inv) => {
                      const studentName = getStudentName(inv.studentId);
                      return (
                        <button
                          onClick={() => {
                            if (currentUser?.role) {
                              router.push(`/dashboard/${currentUser.role}/students?search=${encodeURIComponent(studentName)}`);
                            }
                          }}
                          className="font-semibold text-slate-950 dark:text-slate-100 hover:text-[#256ff1] dark:hover:text-blue-400 hover:underline text-left cursor-pointer transition-colors"
                        >
                          {studentName}
                        </button>
                      );
                    }
                  },
                  {
                    header: "Billing Reference",
                    accessor: (inv) => <span className="text-slate-655 dark:text-slate-400 max-w-[150px] truncate">{inv.description}</span>
                  },
                  {
                    header: "Due Date",
                    accessor: (inv) => <span className={`font-semibold ${inv.status === "Unpaid" ? "text-rose-500" : "text-slate-450 dark:text-slate-500"}`}>{inv.dueDate}</span>
                  },
                  {
                    header: "Amount",
                    accessor: (inv) => <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{inv.amount.toLocaleString()} KSh</span>
                  },
                  {
                    header: "Paid Status",
                    accessor: (inv) => {
                      const status = inv.status;
                      const balance = inv.amount - (inv.paidAmount || 0);
                      const alerts = getPaymentAlerts([inv], students as any);
                      const hasAlert = alerts.length > 0;

                      return (
                        <div className="flex flex-col gap-1 items-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            status === "Paid" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" : 
                            status === "Partially Paid" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400" :
                            "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                          }`}>
                            {status} {status === "Partially Paid" && `(${balance.toLocaleString()} KSh left)`}
                          </span>
                          {hasAlert && (
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter animate-pulse ${
                              alerts[0].severity === "high" ? "bg-rose-600 text-white" : "bg-amber-500 text-white"
                            }`}>
                              Overdue Installment
                            </span>
                          )}
                        </div>
                      );
                    }
                  },
                  {
                    header: "Action",
                    align: "center",
                    accessor: (inv) => (
                      <div className="flex items-center gap-2 justify-center">
                        <button 
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setInvoiceModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-50 text-indigo-650 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.05] active:scale-[0.95] shadow-sm flex items-center justify-center shadow-indigo-500/5 hover:shadow-md"
                          title="View Invoice Details"
                        >
                          <FaEye size={13} />
                          Details
                        </button>
                        {inv.status !== "Paid" && (
                          <button 
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setAdminPaymentModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-50 text-emerald-650 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.05] active:scale-[0.95] shadow-sm flex items-center justify-center shadow-emerald-500/5 hover:shadow-md"
                            title="Record Payment"
                          >
                            <FaRegCreditCard size={13} />
                            Record Payment
                          </button>
                        )}
                      </div>
                    )
                  }
                ]}
              />
            </div>

            {/* Settled Transactions Logs */}
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">Successful Settlement Logs</h2>
                <p className="text-xs text-slate-400 mt-0.5">Audit log of cleared payments and transfer details.</p>
              </div>

              <CustomTable
                data={filteredPayments}
                searchQuery={paymentSearch}
                onSearchChange={setPaymentSearch}
                searchPlaceholder="Search payment logs..."
                noun="logs"
                pageSize={5}
                columns={[
                  {
                    header: "Receipt ID",
                    accessor: (p) => <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">{p.id}</span>
                  },
                  {
                    header: "Billing Reference",
                    accessor: (p) => {
                      const inv = invoices.find(i => i.id === p.invoiceId);
                      return <span className="font-semibold text-slate-800 dark:text-slate-200">{inv?.description || p.invoiceId}</span>;
                    }
                  },
                  {
                    header: "Clearance Date",
                    accessor: (p) => <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">{p.date}</span>
                  },
                  {
                    header: "Payment Method",
                    accessor: (p) => <span className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase">{p.paymentMethod}</span>
                  },
                  {
                    header: "Settled Amount",
                    align: "right",
                    accessor: (p) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{p.amount.toLocaleString()} KSh</span>
                  }
                ]}
              />
            </div>
          </div>
        </div>
              {/* Issue Invoice Modal with clean aesthetics (rendered via Portal) */}
        {isIssueModalOpen && mounted && createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Backdrop with soft blur */}
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
              onClick={() => setIsIssueModalOpen(false)}
            />
            
            {/* Form Container */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm shadow-slate-100/10 dark:shadow-none transition-all duration-300 transform scale-100 z-10 animate-scale-up">
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setIsIssueModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <FaTimes size={16} />
              </button>

              <div className="flex items-center gap-2 mb-4 text-[#256ff1]">
                <FaFileInvoiceDollar size={18} />
                <h2 className="text-base font-extrabold text-slate-950 dark:text-slate-100">Issue New Invoice</h2>
              </div>
              
              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                    Target Student
                  </label>
                  <CustomSelect
                    options={students.map(s => ({ value: s.id, label: `${s.name} (${s.courseLevel || 'No Level'})` }))}
                    value={invoiceStudentId}
                    onChange={(val) => {
                      setInvoiceStudentId(val);
                      const student = students.find(s => s.id === val);
                      if (student?.courseLevel) {
                        const level = student.courseLevel;
                        if (level === "A1" || level === "A2") setInvoiceAmount("30000");
                        if (level === "B1" || level === "B2") setInvoiceAmount("35000");
                        setInvoiceDesc(`${level} Course Enrollment Fee`);
                      }
                    }}
                    placeholder="Choose student..."
                    buttonClassName="!border-2 !border-gray-200 dark:!border-slate-800 !rounded-xl hover:!border-[#256ff1]/60 transition-all !text-slate-800 dark:!text-slate-200 font-semibold"
                    style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                    size="lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                    Invoiced Fee (KSh)
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    required 
                    placeholder="e.g. 30000"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 dark:text-slate-200 placeholder-slate-400 bg-white"
                    style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                    Billing Reference / Description
                  </label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Deutsch B2 Kursgebühr Juni"
                    value={invoiceDesc}
                    onChange={(e) => setInvoiceDesc(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 dark:text-slate-200 placeholder-slate-400 bg-white"
                    style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsIssueModalOpen(false)}
                    className="w-1/3 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={createInvoice.isPending}
                    className="w-2/3 bg-[#256ff1] hover:bg-blue-600 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl 
                      transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]
                      cursor-pointer shadow-sm hover:shadow-md shadow-[#256ff1]/30 text-center text-sm flex items-center justify-center gap-2"
                  >
                    {createInvoice.isPending ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Issue Invoice"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        <InvoiceModal 
          isOpen={invoiceModalOpen} 
          onClose={() => setInvoiceModalOpen(false)} 
          invoice={selectedInvoice}
          studentName={selectedInvoice ? getStudentName(selectedInvoice.studentId) : undefined}
        />
        <AdminPaymentModal
          isOpen={adminPaymentModalOpen}
          onClose={() => setAdminPaymentModalOpen(false)}
          invoice={selectedInvoice}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: STUDENT & PARENT (Tuition Portal)
  // -------------------------------------------------------------
  if (role === "student" || role === "parent") {
    const targetUserId = role === "student" ? currentUser.id : selectedChildId;

    if (!targetUserId) {
      return (
        <div className="text-slate-400 text-center py-10 font-medium">
          Please select a linked child above to view billing and invoices.
        </div>
      );
    }

    const myInvoices = invoices.filter(i => i.studentId === targetUserId);
    const myPayments = payments.filter(p => {
      const inv = invoices.find(i => i.id === p.invoiceId);
      return inv?.studentId === targetUserId;
    });

    const handlePayClick = (inv: Invoice) => {
      setSelectedInvoice(inv);
      setPaymentModalOpen(true);
    };

    const handlePaymentSuccess = (invoiceId: string, method: string) => {
      payInvoice.mutate({
        invoiceId,
        paymentMethod: method
      });
    };

    const isLoading = invoicesLoading || paymentsLoading;

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-[#256ff1] border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fade-in w-full">
        <PageHeader 
          title="Tuition & Invoices" 
          description={
            role === "student"
              ? "Settle pending tuition fees, view active outstanding invoices, and track payment history."
              : "Settle pending school fees, view outstanding invoices, and audit historical transactions for your child."
          }
        />

        {/* Outstanding Fees */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm shadow-slate-100/10">
          <div className="flex items-center gap-2 mb-4 text-[#256ff1]">
            <FaFileInvoiceDollar size={18} />
            <h2 className="text-lg font-black text-slate-950 dark:text-slate-100">Outstanding School Invoices</h2>
          </div>

          <div className="overflow-x-auto border border-slate-150/60 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-sm min-w-[500px]">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-850/30 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                  <th className="p-3.5">Invoice ID</th>
                  <th className="p-3.5">Billing Reference</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {myInvoices.filter(i => i.status === "Unpaid").map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/10 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">{inv.id}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400 font-semibold">{inv.description}</td>
                    <td className="p-3.5 text-rose-500 font-bold">{inv.dueDate}</td>
                    <td className="p-3.5 font-mono font-bold text-[#256ff1]">{inv.amount.toLocaleString()} KSh</td>
                    <td className="p-3.5 text-right">
                      <button 
                        onClick={() => handlePayClick(inv)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#256ff1] hover:bg-blue-600 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-md shadow-[#256ff1]/10"
                      >
                        <FaRegCreditCard size={12} />
                        Pay Invoice
                      </button>
                    </td>
                  </tr>
                ))}
                {myInvoices.filter(i => i.status === "Unpaid").length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 font-medium">
                      No outstanding fees are currently pending. Thank you!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Settled Transactions History */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm shadow-slate-100/10">
          <div className="flex items-center gap-2 mb-4 text-emerald-500">
            <FaCheckCircle size={18} />
            <h2 className="text-lg font-black text-slate-950 dark:text-slate-100">Settled Transactions History</h2>
          </div>
          
          <div className="overflow-x-auto border border-slate-150/60 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-sm min-w-[500px]">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-850/30 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                  <th className="p-3.5">Transaction ID</th>
                  <th className="p-3.5">Billing Reference</th>
                  <th className="p-3.5">Date Settled</th>
                  <th className="p-3.5 text-right">Paid Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {myPayments.map(p => {
                  const inv = invoices.find(i => i.id === p.invoiceId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/10 transition-colors">
                      <td className="p-3.5 font-mono text-slate-400 dark:text-slate-500 font-bold">{p.id}</td>
                      <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{inv?.description || p.invoiceId}</td>
                      <td className="p-3.5 font-mono text-slate-400 dark:text-slate-500 font-bold">{p.date}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">+{p.amount.toLocaleString()} KSh</td>
                    </tr>
                  );
                })}
                {myPayments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400 font-medium">
                      No historical transactions recorded on this profile.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <InvoiceModal 
          isOpen={invoiceModalOpen} 
          onClose={() => setInvoiceModalOpen(false)} 
          invoice={selectedInvoice} 
        />
        <AdminPaymentModal
          isOpen={adminPaymentModalOpen}
          onClose={() => setAdminPaymentModalOpen(false)}
          invoice={selectedInvoice}
        />
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          invoice={selectedInvoice}
          onPaymentSuccess={handlePaymentSuccess}
        />
      </div>
    );
  }

  return null;
}

export default function Payments(props: PaymentsProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#256ff1] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PaymentsContent {...props} />
    </Suspense>
  );
}
