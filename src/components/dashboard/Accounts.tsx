/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSchool } from "@/context/SchoolContext";
import { PageHeader } from "@/components/PageHeader";
import StatsCard from "@/components/StatsCard";
import CustomTable from "@/components/ui/CustomTable";
import CustomSelect from "@/components/ui/CustomSelect";
import { FaUserPlus, FaTimes } from "react-icons/fa";

export default function Accounts() {
  const {
    currentUser,
    users,
    subjects,
    addTeacher
  } = useSchool();

  // Localized UI and form states for optimized rendering
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherSubjectId, setTeacherSubjectId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Esc key & body scroll lock listener for modern modal UX
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
      }
    };
    if (isModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  if (!currentUser) return null;

  const role = currentUser.role;

  // Restrict access to administrators
  if (role !== "super-admin" && role !== "admin") {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900/30 max-w-2xl mx-auto mt-10">
        <h2 className="font-extrabold text-lg flex items-center gap-2">
          <span>Access Denied</span>
        </h2>
        <p className="text-sm mt-1">This directory is only accessible to authorized administrators.</p>
      </div>
    );
  }

  // Form Submission
  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName || !teacherEmail || !teacherSubjectId) return;
    addTeacher(teacherName, teacherEmail, teacherSubjectId);
    setTeacherName("");
    setTeacherEmail("");
    setTeacherSubjectId("");
    setIsModalOpen(false);
    alert("Instructor account registered successfully!");
  };

  // Filter accounts based on search & role
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === "all" ? true : u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-fade-in w-full">
      <PageHeader 
        title={role === "super-admin" ? "System Accounts" : "Instructor Accounts"} 
        description={
          role === "super-admin"
            ? "Manage and audit system credentials and administrative roles."
            : "Manage and audit professional teacher credentials and classroom assignments."
        }
        actionButton={{
          text: "Add Instructor",
          icon: <FaUserPlus size={12} />,
          onClick: () => setIsModalOpen(true)
        }}
      />

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Accounts"
          total={users.length}
          iconName="FiUsers"
          color="text-[#256ff1]"
          description="System credentials registered"
        />
        <StatsCard
          title="Administrators"
          total={users.filter(u => u.role === "super-admin" || u.role === "admin").length}
          iconName="FiShield"
          color="text-purple-500"
          description="Security & admin roles"
        />
        <StatsCard
          title="Teachers"
          total={users.filter(u => u.role === "teacher").length}
          iconName="FiBriefcase"
          color="text-indigo-500"
          description="Academic instructors"
        />
        <StatsCard
          title="Guardians"
          total={users.filter(u => u.role === "parent").length}
          iconName="FiHome"
          color="text-amber-500"
          description="Parent/guardian contacts"
        />
      </div>

      <div className="w-full">
        <CustomTable
          data={filteredUsers}
          searchQuery={userSearch}
          onSearchChange={setUserSearch}
          searchPlaceholder="Search accounts..."
          noun="accounts"
          pageSize={8}
          filterElement={
            <CustomSelect
              options={[
                { value: "all", label: "All Roles" },
                { value: "super-admin", label: "Super Admin" },
                { value: "admin", label: "Admin" },
                { value: "teacher", label: "Teacher" },
                { value: "student", label: "Student" },
                { value: "parent", label: "Parent" },
              ]}
              value={roleFilter}
              onChange={setRoleFilter}
              placeholder="All Roles"
              size="md"
              buttonClassName="!border-2 !border-gray-200 dark:!border-slate-800 !rounded-xl hover:!border-[#256ff1]/60 transition-all !text-slate-800 dark:!text-slate-200 font-semibold min-w-[150px] !py-2.5"
              style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
            />
          }
          columns={[
            {
              header: "Account Holder",
              accessor: (user) => (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-xs text-[#256ff1] shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</span>
                </div>
              )
            },
            {
              header: "Email Address",
              accessor: (user) => <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">{user.email}</span>
            },
            {
              header: "Role Badge",
              accessor: (user) => (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  user.role === "super-admin" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" :
                  user.role === "admin" ? "bg-[#256ff1]/10 text-[#256ff1] dark:bg-blue-900/30 dark:text-blue-300" :
                  user.role === "teacher" ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" :
                  user.role === "student" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" :
                  "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                }`}>
                  {user.role}
                </span>
              )
            },
            {
              header: "User ID",
              align: "center",
              accessor: (user) => <span className="font-mono text-[11px] text-slate-400 font-bold">{user.id}</span>
            }
          ]}
        />
      </div>

      {/* Add Instructor Modal with premium aesthetics & backdrop blur (rendered via Portal to break out of layout transform) */}
      {isModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-2000 flex items-center justify-center p-4">
          {/* Backdrop with soft blur */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Form Container */}
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm shadow-slate-100/10 dark:shadow-none transition-all duration-300 transform scale-100 z-10 animate-scale-up">
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Close modal"
            >
              <FaTimes size={16} />
            </button>

            <div className="flex items-center gap-2 mb-4 text-[#256ff1]">
              <FaUserPlus size={18} />
              <h2 className="text-base font-extrabold text-slate-950 dark:text-slate-100">Add Instructor Account</h2>
            </div>
            
            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Full Name
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Dr. Julia Fischer"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-4 py-3 backdrop-blur-md border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 placeholder-slate-400 bg-white"
                  style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Email Address
                </label>
                <input 
                  type="email" 
                  required 
                  placeholder="fischer@cianna.de"
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  className="w-full px-4 py-3 backdrop-blur-md border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 placeholder-slate-400 bg-white"
                  style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Academic Specialization
                </label>
                <CustomSelect
                  options={subjects.map(s => ({ value: s.id, label: s.name }))}
                  value={teacherSubjectId}
                  onChange={setTeacherSubjectId}
                  placeholder="Select subject focus..."
                  buttonClassName="!border-2 !border-gray-200 !rounded-xl hover:!border-[#256ff1]/60 transition-all !text-slate-800 font-semibold"
                  style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
                  size="lg"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/3 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-2/3 bg-[#256ff1] hover:bg-[#3b7eff] text-white font-semibold py-3.5 rounded-xl 
                    transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]
                    cursor-pointer shadow-sm hover:shadow-md shadow-[#256ff1]/30 text-center text-sm"
                >
                  Register Teacher
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
