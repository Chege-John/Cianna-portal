"use client";

import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight, FaSearch, FaSchool } from "react-icons/fa";

export interface Column<T> {
  header: string;
  accessor: (item: T, index: number) => React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

interface CustomTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  filterElement?: React.ReactNode;
  noun?: string;
  pageSize?: number;
  emptyState?: {
    title: string;
    description: string;
    icon?: React.ReactNode;
  };
}

export default function CustomTable<T>({
  data,
  columns,
  searchPlaceholder = "Suchen...",
  searchQuery,
  onSearchChange,
  filterElement,
  noun = "Einträge",
  pageSize = 8,
  emptyState = {
    title: "Keine Daten gefunden",
    description: "Es sind derzeit keine Einträge vorhanden.",
    icon: <FaSchool className="w-10 h-10 text-white" />
  }
}: CustomTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to first page when data changes (e.g. searching/filtering)
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length, searchQuery]);

  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  
  // Safe boundaries for current page
  const activePage = Math.min(currentPage, totalPages);
  
  const start = total === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const end = Math.min(activePage * pageSize, total);

  // Slice data for active page
  const paginatedData = data.slice((activePage - 1) * pageSize, activePage * pageSize);

  const go = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
    }
  };

  const hasHeader = onSearchChange || filterElement;

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        
        {/* Table Header Section with Search and Filters */}
        {hasHeader && (
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20">
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              
              {/* Left side: Search Input */}
              {onSearchChange && (
                <div className="relative flex-1 max-w-md">
                  <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery || ""}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#256ff1] focus:ring-2 focus:ring-[#256ff1]/10 dark:focus:ring-[#256ff1]/20 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>
              )}

              {/* Right side: Filter & Counter */}
              <div className="flex flex-wrap items-center gap-3">
                {filterElement}

                <div className="inline-flex items-center px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm">
                  <span className="font-extrabold text-[#256ff1] dark:text-blue-400 text-sm">
                    {total.toLocaleString()}
                  </span>
                  <span className="ml-1.5 uppercase tracking-wider">{noun}</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Table Content Section */}
        <div className="bg-white dark:bg-slate-900 overflow-hidden">
          {total === 0 ? (
            <div className="p-16 text-center bg-slate-50/10 dark:bg-slate-950/5">
              <div className="mx-auto w-16 h-16 bg-[#256ff1] dark:bg-blue-600 rounded-2xl flex items-center justify-center mb-5 shadow-md shadow-[#256ff1]/10">
                {emptyState.icon}
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">
                {emptyState.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm">
                {emptyState.description}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    {columns.map((col, index) => (
                      <th
                        key={index}
                        className={`px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap ${
                          col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                        } ${col.className || ""}`}
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedData.map((item, rowIndex) => (
                    <tr 
                      key={rowIndex} 
                      className="hover:bg-slate-50/30 dark:hover:bg-slate-850/20 transition-colors"
                    >
                      {columns.map((col, colIndex) => (
                        <td 
                          key={colIndex} 
                          className={`px-6 py-3.5 text-slate-700 dark:text-slate-300 font-medium ${
                            col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                          } ${col.className || ""}`}
                        >
                          {col.accessor(item, rowIndex)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Pagination Footer */}
          <div className="px-6 py-4.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase">
              Anzeige <span className="text-slate-900 dark:text-slate-200">{start} - {end}</span> von <span className="text-slate-900 dark:text-slate-200">{total.toLocaleString()}</span> {noun}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <div className="text-[11px] text-slate-400 dark:text-slate-500 font-bold mr-2 uppercase tracking-wider">
                  Seite {activePage} / {totalPages}
                </div>
                
                {/* Prev Button */}
                <button
                  onClick={() => go(activePage - 1)}
                  disabled={activePage <= 1}
                  className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-850 disabled:opacity-30 disabled:hover:bg-transparent transition-all bg-white/50 dark:bg-slate-900/50 shadow-sm cursor-pointer"
                  title="Vorherige Seite"
                >
                  <FaChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Page Numbers */}
                <div className="hidden md:flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= activePage - 1 && pageNum <= activePage + 1)
                    ) {
                      const isCurrent = activePage === pageNum;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => go(pageNum)}
                          className={`w-8.5 h-8.5 flex items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isCurrent
                              ? "bg-[#256ff1] text-white shadow-md shadow-[#256ff1]/20 scale-[1.03]"
                              : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 bg-white/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (pageNum === activePage - 2 || pageNum === activePage + 2) {
                      return <span key={pageNum} className="text-slate-400 px-1 font-bold">...</span>;
                    }
                    return null;
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => go(activePage + 1)}
                  disabled={activePage >= totalPages}
                  className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-850 disabled:opacity-30 disabled:hover:bg-transparent transition-all bg-white/50 dark:bg-slate-900/50 shadow-sm cursor-pointer"
                  title="Nächste Seite"
                >
                  <FaChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
