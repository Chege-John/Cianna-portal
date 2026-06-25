/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  useUsers, 
  useSubjects, 
  useSchoolMutations 
} from "@/hooks/use-school-data";
import { FaUserPlus, FaTimes, FaSpinner } from "react-icons/fa";
import { FiEye, FiEdit, FiTrash2, FiUser, FiMail, FiShield, FiAlertTriangle, FiCalendar } from "react-icons/fi";
import StatsCard from "../StatsCard";
import { PageHeader } from "../PageHeader";
import CustomTable from "../ui/CustomTable";
import CustomSelect from "../ui/CustomSelect";
import { useSchool, User, Role } from "@/context/SchoolContext";

export default function Accounts() {
  const { currentUser } = useSchool();
  
  // Data Fetching
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  
  // Mutations
  const { addTeacher, updateUser, deleteUser } = useSchoolMutations();

  // Localized UI and form states for optimized rendering
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherSubjectId, setTeacherSubjectId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Modal states for View, Edit, Delete
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Edit form states
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"super-admin" | "admin" | "teacher" | "student" | "parent">("student");


  useEffect(() => {
    setMounted(true);
  }, []);

  // Esc key & body scroll lock listener for modern modal UX
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
        setIsViewModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
      }
    };
    const anyModalOpen = isModalOpen || isViewModalOpen || isEditModalOpen || isDeleteModalOpen;
    if (anyModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen, isViewModalOpen, isEditModalOpen, isDeleteModalOpen]);

  const isLoading = usersLoading || subjectsLoading;

  if (!currentUser) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#256ff1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
    
    addTeacher.mutate({
      name: teacherName,
      email: teacherEmail,
      subjectId: teacherSubjectId
    }, {
      onSuccess: () => {
        setTeacherName("");
        setTeacherEmail("");
        setTeacherSubjectId("");
        setIsModalOpen(false);
        alert("Instructor account registered successfully!");
      }
    });
  };

  // View/Edit/Delete Handlers
  const handleView = (user: User) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !editName || !editEmail) return;

    updateUser.mutate({
      id: selectedUser.id,
      name: editName,
      email: editEmail,
      role: editRole,
    }, {
      onSuccess: () => {
        setIsEditModalOpen(false);
        setSelectedUser(null);
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!selectedUser) return;

    deleteUser.mutate(selectedUser.id, {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
      }
    });
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
            },
            {
              header: "Actions",
              align: "right",
              accessor: (user) => (
                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleView(user)}
                    className="p-2.5 text-blue-600 dark:text-blue-400 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-all duration-300 transform cursor-pointer flex items-center justify-center shadow-sm shadow-blue-500/5 hover:shadow-md"
                    title="View Account Details"
                  >
                    <FiEye size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(user)}
                    className="p-2.5 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl transition-all duration-300 transform cursor-pointer flex items-center justify-center shadow-sm shadow-emerald-500/5 hover:shadow-md"
                    title="Edit Account"
                  >
                    <FiEdit size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(user)}
                    className="p-2.5 text-rose-600 dark:text-rose-400 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-xl transition-all duration-300 transform cursor-pointer flex items-center justify-center shadow-sm shadow-rose-500/5 hover:shadow-md"
                    title="Delete Account"
                  >
                    <FiTrash2 size={17} />
                  </button>
                </div>
              )
            }
          ]}
        />
      </div>

      {/* Add Instructor Modal */}
{isModalOpen && mounted && createPortal(
  <div className="fixed inset-0 z-2000 flex items-center justify-center p-4">
    {/* Backdrop with soft blur */}
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
      onClick={() => setIsModalOpen(false)}
    />
    
    {/* Form Container */}
    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm shadow-slate-100/10 dark:shadow-none transition-all duration-300 transform scale-100 z-10 animate-scale-up">
      
      {/* Header band */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-[#256ff1]">
          <FaUserPlus size={18} />
          <h2 className="text-base font-extrabold text-slate-950 dark:text-slate-100">Add Instructor Account</h2>
        </div>
        <button 
          type="button"
          onClick={() => setIsModalOpen(false)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <FaTimes size={16} />
        </button>
      </div>

      <form onSubmit={handleAddTeacher}>
        {/* Body — form fields */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Full Name
            </label>
            <input 
              type="text" 
              required 
              placeholder="e.g. Dr. Julia Fischer"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 dark:text-slate-200 placeholder-slate-400 bg-white"
              style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Email Address
            </label>
            <input 
              type="email" 
              required 
              placeholder="fischer@cianna.de"
              value={teacherEmail}
              onChange={(e) => setTeacherEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 dark:text-slate-200 placeholder-slate-400 bg-white"
              style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Academic Specialization
            </label>
            <CustomSelect
              options={subjects.map(s => ({ value: s.id, label: s.name }))}
              value={teacherSubjectId}
              onChange={setTeacherSubjectId}
              placeholder="Choose subject..."
              buttonClassName="!border-2 !border-gray-200 dark:!border-slate-800 !rounded-xl hover:!border-[#256ff1]/60 transition-all !text-slate-800 dark:!text-slate-200 font-semibold"
              style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
              size="lg"
            />
          </div>
        </div>

        {/* Footer band — actions */}
        <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
          <button 
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="w-1/3 py-3.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={addTeacher.isPending}
            className="w-2/3 bg-[#256ff1] hover:bg-blue-600 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl 
              transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]
              cursor-pointer shadow-sm hover:shadow-md shadow-[#256ff1]/30 text-center text-sm flex items-center justify-center gap-2"
          >
            {addTeacher.isPending ? (
              <>
                <FaSpinner className="animate-spin" />
                Registering...
              </>
            ) : (
              "Register Teacher"
            )}
          </button>
        </div>
      </form>
    </div>
  </div>,
  document.body
)}

      {/* View Account Modal */}
{isViewModalOpen && selectedUser && mounted && createPortal(
  <div className="fixed inset-0 z-2000 flex items-center justify-center p-4">
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
      onClick={() => setIsViewModalOpen(false)}
    />
    
    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm shadow-slate-100/10 dark:shadow-none transition-all duration-300 transform scale-100 z-10 animate-scale-up">

      {/* Header band */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 rounded-t-2xl">
        <div className="flex items-center gap-2 text-[#256ff1]">
          <FiEye size={18} />
          <h2 className="text-base font-extrabold text-slate-950 dark:text-slate-100">Account Details</h2>
        </div>
        <button 
          type="button"
          onClick={() => setIsViewModalOpen(false)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <FaTimes size={16} />
        </button>
      </div>

      {/* Body — details */}
<div className="px-6 py-5">
  <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 overflow-hidden divide-y divide-slate-200/70 dark:divide-slate-700/60">
    <div className="flex justify-between items-center px-4 py-3.5">
      <span className="font-semibold text-sm text-slate-450 dark:text-slate-500">Account Holder</span>
      <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{selectedUser.name}</span>
    </div>
    <div className="flex justify-between items-center px-4 py-3.5">
      <span className="font-semibold text-sm text-slate-450 dark:text-slate-500">Email Address</span>
      <span className="font-bold text-sm text-slate-800 dark:text-slate-200 font-mono">{selectedUser.email}</span>
    </div>
    <div className="flex justify-between items-center px-4 py-3.5">
      <span className="font-semibold text-sm text-slate-450 dark:text-slate-500">System Role</span>
      <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
        selectedUser.role === "super-admin" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" :
        selectedUser.role === "admin" ? "bg-[#256ff1]/10 text-[#256ff1] dark:bg-blue-900/30 dark:text-blue-300" :
        selectedUser.role === "teacher" ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" :
        selectedUser.role === "student" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" :
        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
      }`}>
        {selectedUser.role}
      </span>
    </div>
    <div className="flex justify-between items-center px-4 py-3.5">
      <span className="font-semibold text-sm text-slate-450 dark:text-slate-500">Account ID</span>
      <span className="font-bold text-sm text-slate-500 dark:text-slate-450 font-mono">{selectedUser.id}</span>
    </div>
  </div>
</div>

      {/* Footer band — actions */}
      <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl">
        <button 
          type="button"
          onClick={() => setIsViewModalOpen(false)}
          className="w-1/2 py-3 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200"
        >
          Close
        </button>
        <button 
          type="button"
          onClick={() => {
            setIsViewModalOpen(false);
            handleEdit(selectedUser);
          }}
          className="w-1/2 bg-[#256ff1] hover:bg-blue-600 text-white font-bold py-3 rounded-xl 
            transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]
            cursor-pointer shadow-sm hover:shadow-md shadow-[#256ff1]/30 text-center text-sm flex items-center justify-center gap-2"
        >
          <FiEdit size={14} />
          Edit Account
        </button>
      </div>
    </div>
  </div>,
  document.body
)}

      {/* Edit Account Modal */}
{isEditModalOpen && selectedUser && mounted && createPortal(
  <div className="fixed inset-0 z-2000 flex items-center justify-center p-4">
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
      onClick={() => setIsEditModalOpen(false)}
    />
    
    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm shadow-slate-100/10 dark:shadow-none transition-all duration-300 transform scale-100 z-10 animate-scale-up">

      {/* Header band */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 rounded-t-2xl">
        <div className="flex items-center gap-2 text-[#256ff1]">
          <FiEdit size={18} />
          <h2 className="text-base font-extrabold text-slate-950 dark:text-slate-100">Edit System Account</h2>
        </div>
        <button 
          type="button"
          onClick={() => setIsEditModalOpen(false)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <FaTimes size={16} />
        </button>
      </div>

      <form onSubmit={handleEditSubmit}>
        {/* Body — form fields */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Full Name
            </label>
            <input 
              type="text" 
              required 
              placeholder="Full name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 dark:text-slate-200 placeholder-slate-400 bg-white"
              style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Email Address
            </label>
            <input 
              type="email" 
              required 
              placeholder="Email address"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#256ff1] outline-none transition-all text-slate-800 dark:text-slate-200 placeholder-slate-400 bg-white"
              style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              System Authorization Role
            </label>
            <CustomSelect
              options={[
                { value: "super-admin", label: "Super Admin" },
                { value: "admin", label: "Admin" },
                { value: "teacher", label: "Teacher" },
                { value: "student", label: "Student" },
                { value: "parent", label: "Parent" },
              ]}
              value={editRole}
              onChange={(val) => setEditRole(val as Role)}
              placeholder="Choose role..."
              buttonClassName="!border-2 !border-gray-200 dark:!border-slate-800 !rounded-xl hover:!border-[#256ff1]/60 transition-all !text-slate-800 dark:!text-slate-200 font-semibold"
              style={{ backgroundColor: "oklch(96.8% .007 247.896)" }}
              size="lg"
            />
          </div>
        </div>

        {/* Footer band — actions */}
        <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl">
          <button 
            type="button"
            onClick={() => setIsEditModalOpen(false)}
            className="w-1/3 py-3.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={updateUser.isPending}
            className="w-2/3 bg-[#256ff1] hover:bg-blue-600 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl 
              transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]
              cursor-pointer shadow-sm hover:shadow-md shadow-[#256ff1]/30 text-center text-sm flex items-center justify-center gap-2"
          >
            {updateUser.isPending ? (
              <>
                <FaSpinner className="animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  </div>,
  document.body
)}

     {/* Delete Account Modal */}
{isDeleteModalOpen && selectedUser && mounted && createPortal(
  <div className="fixed inset-0 z-2000 flex items-center justify-center p-4">
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
      onClick={() => setIsDeleteModalOpen(false)}
    />
    
    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm shadow-slate-100/10 dark:shadow-none transition-all duration-300 transform scale-100 z-10 animate-scale-up">

      {/* Header band — rose-tinted for destructive context */}
      <div className="flex items-center justify-between px-6 py-4 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-100 dark:border-rose-900/40 rounded-t-2xl">
        <div className="flex items-center gap-2 text-rose-500">
          <FiAlertTriangle size={18} />
          <h2 className="text-base font-extrabold text-slate-950 dark:text-slate-100">Delete Account?</h2>
        </div>
        <button 
          type="button"
          onClick={() => setIsDeleteModalOpen(false)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <FaTimes size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-4">

        {/* The question — standalone, not boxed with the data */}
        <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
          Are you absolutely sure you want to permanently delete this user account?
        </p>

        {/* User detail card — rose tint, since this is "what's at risk" */}
        <div className="rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 overflow-hidden divide-y divide-rose-200/60 dark:divide-rose-900/40">
          <div className="flex justify-between items-center px-4 py-3">
            <span className="font-semibold text-sm text-rose-700/70 dark:text-rose-300/70">Holder Name</span>
            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{selectedUser.name}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-3">
            <span className="font-semibold text-sm text-rose-700/70 dark:text-rose-300/70">Email</span>
            <span className="font-bold text-sm text-slate-800 dark:text-slate-200 font-mono">{selectedUser.email}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-3">
            <span className="font-semibold text-sm text-rose-700/70 dark:text-rose-300/70">System Role</span>
            <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
              {selectedUser.role}
            </span>
          </div>
        </div>

        {/* Cascading impact — amber, a distinct tier of severity from the rose "action" above */}
        <div className="flex gap-2.5 text-xs leading-relaxed bg-amber-50 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200/70 dark:border-amber-900/40">
          <FiAlertTriangle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <strong className="text-amber-800 dark:text-amber-300 font-semibold block text-xs mb-1">
              Cascading Impact Warning
            </strong>
            <span className="text-amber-700/90 dark:text-amber-400/80">
              This operation triggers a cascade delete: profile records, active sessions, classroom relations, grade books, and historical attendance for this account will be permanently expunged.
            </span>
          </div>
        </div>
      </div>

      {/* Footer band */}
      <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl">
        <button 
          type="button"
          onClick={() => setIsDeleteModalOpen(false)}
          className="w-1/2 py-3 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200"
        >
          Cancel, Keep
        </button>
        <button 
          type="button"
          onClick={handleDeleteConfirm}
          disabled={deleteUser.isPending}
          className="w-1/2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold py-3 rounded-xl 
            transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]
            cursor-pointer shadow-sm hover:shadow-md shadow-rose-600/30 text-center text-sm flex items-center justify-center gap-2"
        >
          {deleteUser.isPending ? (
            <>
              <FaSpinner className="animate-spin" />
              Deleting...
            </>
          ) : (
            "Yes, Delete User"
          )}
        </button>
      </div>
    </div>
  </div>,
  document.body
)}
    </div>
  );
}
