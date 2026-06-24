"use client";

import React, { useState } from "react";
import { useSchool } from "@/context/SchoolContext";
import { PageHeader } from "@/components/PageHeader";
import StatsCard from "@/components/StatsCard";
import CustomTable from "@/components/ui/CustomTable";
import { FaUserPlus, FaUsers } from "react-icons/fa";

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
          onClick: () => {
            const element = document.getElementById("add-instructor-form");
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

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* User Directory */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          <div className="mb-1">
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">System Accounts Directory</h2>
            <p className="text-xs text-slate-400 mt-0.5">Filter and search all registered platform user credentials.</p>
          </div>
          <CustomTable
            data={filteredUsers}
            searchQuery={userSearch}
            onSearchChange={setUserSearch}
            searchPlaceholder="Search accounts..."
            noun="accounts"
            pageSize={6}
            filterElement={
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer shadow-sm focus:border-[#256ff1] transition-all"
              >
                <option value="all">All Roles</option>
                <option value="super-admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
                <option value="parent">Parent</option>
              </select>
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

        {/* Form Container */}
        <div id="add-instructor-form" className="xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm shadow-slate-100/10 h-fit transition-all duration-300">
          <div className="flex items-center gap-2 mb-4 text-[#256ff1]">
            <FaUserPlus size={18} />
            <h2 className="text-base font-extrabold text-slate-950 dark:text-slate-100">Add Instructor Account</h2>
          </div>
          
          <form onSubmit={handleAddTeacher} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Full Name</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Dr. Julia Fischer"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-[#256ff1] focus:ring-1 focus:ring-[#256ff1]/10 transition-all font-medium"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Email Address</label>
              <input 
                type="email" 
                required 
                placeholder="fischer@cianna.de"
                value={teacherEmail}
                onChange={(e) => setTeacherEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-[#256ff1] focus:ring-1 focus:ring-[#256ff1]/10 transition-all font-medium"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Academic Specialization</label>
              <select 
                required 
                value={teacherSubjectId}
                onChange={(e) => setTeacherSubjectId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:border-[#256ff1] focus:ring-1 focus:ring-[#256ff1]/10 transition-all font-bold cursor-pointer"
              >
                <option value="">Select subject focus...</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <button 
              type="submit" 
              className="w-full py-2.5 bg-[#256ff1] hover:bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer transition-all duration-200 shadow-md shadow-[#256ff1]/10 mt-2 text-center"
            >
              Register Professional Teacher
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
