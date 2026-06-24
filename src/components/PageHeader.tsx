"use client";

import React from "react";
import { FiPlus } from "react-icons/fi";

interface PageHeaderProps {
  title: string;
  description: string;
  actionButton?: {
    text: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export function PageHeader({ title, description, actionButton }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {title}
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base tracking-[0.01em]">
          {description}
        </p>
      </div>

      {actionButton && (
        <button
          onClick={actionButton.onClick}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm text-sm cursor-pointer shrink-0"
        >
          {actionButton.icon || <FiPlus className="w-5 h-5" />}
          <span>{actionButton.text}</span>
        </button>
      )}
    </div>
  );
}

