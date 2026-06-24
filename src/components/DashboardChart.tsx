"use client";

import React from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  TooltipProps,
} from "recharts";

import { LineChartData } from "@/server-actions/dashboard";

interface DashboardChartRechartsProps {
  data: LineChartData[];
  dataKey?: string;
  xAxisKey?: string;
  color?: string;
  height?: number;
  xAxisInterval?: number;
  showBackground?: boolean;
}

const chartColors = {
  grid: "#e5e7eb",
  gridFill: "#f9fafb",
  tick: "#6b7280",
  axis: "#e5e7eb",
  tooltipBg: "#ffffff",
  tooltipBorder: "#d1d5db",
  tooltipLabel: "#256ff1",
  tooltipText: "#4b5563",
  tooltipValue: "#111827",
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: readonly any[];
  label?: any;
  xAxisKey: string;
  dataKey: string;
}

const CustomTooltip = ({
  active,
  payload,
  xAxisKey,
  dataKey,
}: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const dataPayload = payload[0].payload as Record<string, unknown>;

    return (
      <div
        style={{
          backgroundColor: chartColors.tooltipBg,
          borderColor: chartColors.tooltipBorder,
        }}
        className="shadow-sm rounded-lg border p-2 bg-white"
      >
        <p
          style={{ color: chartColors.tooltipLabel }}
          className="text-xs font-semibold mb-1"
        >
          {String(dataPayload[xAxisKey] ?? "")}
        </p>
        <p style={{ color: chartColors.tooltipText }} className="text-sm">
          Revenue:{" "}
          <span
            style={{ color: chartColors.tooltipValue }}
            className="text-sm font-medium"
          >
            KSh{" "}
            {(dataPayload[dataKey] as number | undefined)?.toLocaleString() ??
              "0"}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

const DashboardChartRecharts: React.FC<DashboardChartRechartsProps> = ({
  data,
  dataKey = "revenue",
  xAxisKey = "month",
  color = "#256ff1",
  height = 350,
  xAxisInterval = 0,
  showBackground = true,
}) => {
  return (
    <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Revenue Overview
          </h3>
          <p className="text-sm text-gray-500">
            Monthly revenue for the current year
          </p>
        </div>
      </div>
      <div className="bg-transparent h-[350px] w-full">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={chartColors.grid}
              vertical={false}
              fill={showBackground ? chartColors.gridFill : "transparent"}
            />
            <XAxis
              dataKey={xAxisKey}
              tick={{
                fontSize: 12,
                fill: chartColors.tick,
                fontWeight: 500,
                fontFamily: "Figtree",
              }}
              tickLine={false}
              axisLine={{ stroke: chartColors.axis }}
              dy={10}
              interval={xAxisInterval}
            />
            <YAxis
              tick={{
                fontSize: 12,
                fill: chartColors.tick,
                fontWeight: 500,
                fontFamily: "Figtree",
              }}
              tickLine={false}
              axisLine={false}
              dx={-5}
              tickFormatter={(value) => `KSh ${value}`}
            />
            <Tooltip
              content={(props) => (
                <CustomTooltip
                  {...props}
                  xAxisKey={xAxisKey}
                  dataKey={dataKey}
                />
              )}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              fill="url(#lineGradient)"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#fff", stroke: color, strokeWidth: 2 }}
              activeDot={{ r: 6, fill: color, stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardChartRecharts;
