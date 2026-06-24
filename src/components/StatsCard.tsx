"use client";

import React from "react";
import {
  FiArrowUpRight,
  FiArrowDownRight,
  FiActivity,
  FiAlertCircle,
  FiBriefcase,
  FiCalendar,
  FiCamera,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiHome,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import type { IconType } from "react-icons";

// Direct imports (not a namespace import) so the unused icon set tree-shakes
// out of the client bundle. Add new icons here as needed.
const ICONS: Record<string, IconType> = {
  FiActivity,
  FiAlertCircle,
  FiBriefcase,
  FiCalendar,
  FiCamera,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiHome,
  FiShield,
  FiUsers,
};

interface StatsCardProps {
  title: string;
  total: number | string;
  trend?: "increment" | "decrement";
  percentage?: number;
  iconName?: string;
  color?: string;
  description?: string;
}

const StatsCard = ({
  title,
  total,
  trend,
  percentage,
  iconName,
  color = "text-gray-400",
  description,
}: StatsCardProps) => {
  const isDecrement = trend === "decrement";

  // Look up the icon from the curated, tree-shakeable map.
  const renderIcon = () => {
    if (!iconName) return null;

    const IconComponent = ICONS[iconName];

    if (!IconComponent) return null;

    return (
      <span className={`w-6 h-6 flex items-center justify-center ${color}`}>
        <IconComponent className="w-full h-full" />
      </span>
    );
  };

  return (
    <article className="bg-white p-6 rounded-20 shadow-400 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-gray-500">{title}</h3>
        {renderIcon()}
      </div>

      <div className="content">
        <div className="flex flex-col gap-4">
          <h2 className="text-4xl font-semibold text-gray-900">{total}</h2>

          {(trend || percentage !== undefined || description) && (
            <div className="flex items-center gap-2">
              {(trend || percentage !== undefined) && (
                <figure 
                  className={`flex items-center gap-1 text-sm font-semibold ${
                    isDecrement ? "text-red-500" : "text-emerald-500"
                  }`}
                >
                  {isDecrement ? (
                    <FiArrowDownRight className="w-5 h-5" />
                  ) : (
                    <FiArrowUpRight className="w-5 h-5" />
                  )}
                  {percentage !== undefined && (
                    <figcaption>{Math.round(percentage)}%</figcaption>
                  )}
                </figure>
              )}

              {description && (
                <p className="text-sm font-medium text-slate-400 truncate">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default StatsCard;
