"use client";

import React from "react";
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  ColumnSeries,
  Category,
  Tooltip,
  DataLabel,
} from "@syncfusion/ej2-react-charts";

interface WeeklyChartProps {
  data: { name: string; amount: number }[];
  total: number;
}

interface TooltipArgs {
  x?: string | number;
  y?: number;
}

export default function WeeklyReservationsChartSyncfusion({ data, total }: WeeklyChartProps) {
  const chartColors = {
    axisColor: "#6b7280",
    titleColor: "#111827",
    gridColor: "#e5e7eb",
    lineColor: "#e5e7eb",
    chartAreaBg: "transparent",
    tooltipBg: "#ffffff",
    tooltipBorder: "#d1d5db",
    tooltipText: "#374151",
    tooltipValue: "#111827",
  };

  const tooltipTemplate = (args: TooltipArgs) => {
    return (
      <div
        style={{
          backgroundColor: chartColors.tooltipBg,
          borderColor: chartColors.tooltipBorder,
        }}
        className="shadow-sm rounded-lg border p-2 bg-white"
      >
        <p className="text-xs font-semibold text-blue-600 mb-1">
          {args.x}
        </p>
        <p style={{ color: chartColors.tooltipText }} className="text-sm">
          Reservations:{" "}
          <span
            style={{ color: chartColors.tooltipValue }}
            className="text-sm font-medium"
          >
            {args.y}
          </span>
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Weekly Reservations
          </h3>
          <p className="text-sm text-gray-500">
            Last 7 days overview
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            {total}
          </p>
          <p className="text-xs text-gray-500">
            Total bookings
          </p>
        </div>
      </div>
      <ChartComponent
        id="weekly-reservations-chart"
        primaryXAxis={{
          valueType: "Category",
          title: "Day",
          titleStyle: {
            size: "14px",
            fontWeight: "600",
            color: chartColors.titleColor,
            fontFamily: "inherit",
          },
          majorGridLines: { width: 0 },
          majorTickLines: { width: 0 },
          lineStyle: { width: 0 },
          labelStyle: {
            color: chartColors.axisColor,
            size: "12px",
            fontWeight: "500",
            fontFamily: "inherit",
          },
        }}
        primaryYAxis={{
          minimum: 0,
          title: "Reservations",
          titleStyle: {
            size: "14px",
            fontWeight: "600",
            color: chartColors.titleColor,
            fontFamily: "inherit",
          },
          labelFormat: "{value}",
          labelStyle: { color: chartColors.axisColor, size: "12px", fontFamily: "inherit" },
          majorGridLines: {
            width: 1,
            color: chartColors.gridColor,
            dashArray: "5,5",
          },
          lineStyle: { width: 1, color: chartColors.lineColor },
        }}
        chartArea={{
          border: { width: 0 },
          background: chartColors.chartAreaBg,
        }}
        background="transparent"
        height="300px"
        width="100%"
        tooltip={{
          enable: true,
          shared: false,
          template: tooltipTemplate as unknown as string,
        }}
      >
        <Inject services={[ColumnSeries, Category, Tooltip, DataLabel]} />
        <SeriesCollectionDirective>
          <SeriesDirective
            dataSource={data}
            xName="name"
            yName="amount"
            type="Column"
            fill="#3b82f6"
            cornerRadius={{ topLeft: 8, topRight: 8 }}
            columnWidth={0.6}
            animation={{ enable: true, duration: 800 }}
            marker={{
              dataLabel: {
                visible: false,
                position: "Top",
                font: {
                  color: "#1e40af",
                  fontWeight: "600",
                  size: "12px",
                },
              },
            }}
          />
        </SeriesCollectionDirective>
      </ChartComponent>
    </div>
  );
}
