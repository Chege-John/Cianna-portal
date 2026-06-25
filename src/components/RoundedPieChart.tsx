"use client";

import { LabelList, Legend, Pie, PieChart } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Data item type
interface DataItem {
  label: string;
  value: number;
  color?: string;
}

interface RoundedPieChartProps {
  data?: DataItem[];
}

// Chart color variables
const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// Compact inline legend for pie chart
const CompactLegend = ({
  payload = [],
}: {
  payload?: Array<{ value: string; color: string }>;
}) => (
  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4">
    {payload.map((entry, index) => (
      <div
        key={`legend-${index}`}
        className="flex items-center gap-1.5 whitespace-nowrap"
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: entry.color }}
        />
        <span className="text-xs text-gray-500 font-medium">{entry.value}</span>
      </div>
    ))}
  </div>
);

export function RoundedPieChart({ data }: RoundedPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center aspect-square max-h-[300px]">
        <p className="text-sm text-gray-400">No data available</p>
      </div>
    );
  }

  const chartData = data;

  // Transform data for Recharts - use chart color variables
  const transformedData = chartData.map((item, index) => ({
    name: item.label,
    value: item.value,
    fill: chartColors[index % chartColors.length],
  }));

  // Build dynamic chart config with chart color variables
  const chartConfig: ChartConfig = {
    value: {
      label: "Count",
    },
    ...chartData.reduce(
      (acc, item, index) => {
        acc[item.label] = {
          label: item.label,
          color: chartColors[index % chartColors.length],
        };
        return acc;
      },
      {} as Record<string, { label: string; color: string }>,
    ),
  };

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[300px] w-full"
    >
      <PieChart>
        <ChartTooltip
          content={<ChartTooltipContent className="bg-white border-none" nameKey="name" hideLabel />}
        />
        <Pie
          data={transformedData}
          innerRadius={40}
          outerRadius={80}
          dataKey="value"
          nameKey="name"
          cornerRadius={6}
          paddingAngle={5}
        >
          <LabelList
            dataKey="value"
            stroke="none"
            fontSize={12}
            fontWeight={600}
            fill="#ffffff"
            formatter={(value: unknown) => String(value)}
          />
        </Pie>
        <Legend content={<CompactLegend />} />
      </PieChart>
    </ChartContainer>
  );
}
