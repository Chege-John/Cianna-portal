"use client";

import React from "react";

interface ChartSkeletonProps {
  height?: string;
}

export function ChartSkeleton({ height = "350px" }: ChartSkeletonProps) {
  return (
    <div
      style={{ height }}
      className="w-full bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded w-40" />
          <div className="h-4 bg-gray-100 rounded w-60" />
        </div>
        <div className="h-8 bg-gray-200 rounded w-16" />
      </div>
      <div className="flex-1 w-full bg-gray-50 rounded-xl flex items-end p-4 gap-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="flex-1 bg-gray-200 rounded-t-lg transition-all duration-300"
            style={{
              height: `${Math.floor(Math.random() * 60) + 20}%`,
              opacity: (12 - index) / 12 + 0.1,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function PieChartSkeleton() {
  return (
    <div className="w-full h-full min-h-[350px] bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse flex flex-col gap-6">
      <div className="space-y-2">
        <div className="h-5 bg-gray-200 rounded w-40" />
        <div className="h-4 bg-gray-100 rounded w-60" />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-48 h-48 rounded-full border-16 border-gray-200 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gray-50" />
        </div>
      </div>
      <div className="flex justify-center gap-4">
        <div className="h-4 bg-gray-200 rounded w-16" />
        <div className="h-4 bg-gray-200 rounded w-16" />
        <div className="h-4 bg-gray-200 rounded w-16" />
      </div>
    </div>
  );
}
