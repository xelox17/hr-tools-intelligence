"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart as RLineChart,
  Pie,
  PieChart as RPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

function ChartFrame({
  loading,
  height = 260,
  children,
}: {
  loading?: boolean;
  height?: number;
  children: ReactNode;
}) {
  if (loading) return <Skeleton className="w-full" style={{ height }} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      {children}
    </ResponsiveContainer>
  );
}

export interface SimpleLineChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  color?: string;
  loading?: boolean;
  height?: number;
}

export function SimpleLineChart({
  data,
  xKey,
  yKey,
  color = CHART_COLORS[1],
  loading,
  height,
}: SimpleLineChartProps) {
  return (
    <ChartFrame loading={loading} height={height}>
      <RLineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={2}
          dot={{ r: 3, fill: color }}
          activeDot={{ r: 5 }}
        />
      </RLineChart>
    </ChartFrame>
  );
}

export interface SimpleBarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  color?: string;
  loading?: boolean;
  height?: number;
}

export function SimpleBarChart({
  data,
  xKey,
  yKey,
  color = CHART_COLORS[0],
  loading,
  height,
}: SimpleBarChartProps) {
  return (
    <ChartFrame loading={loading} height={height}>
      <RBarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
        <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={tooltipStyle} />
        <Bar dataKey={yKey} radius={[6, 6, 0, 0]} maxBarSize={40} fill={color} />
      </RBarChart>
    </ChartFrame>
  );
}

export interface SimplePieChartDatum {
  name: string;
  value: number;
}

export interface SimplePieChartProps {
  data: SimplePieChartDatum[];
  loading?: boolean;
  height?: number;
}

export function SimplePieChart({ data, loading, height = 260 }: SimplePieChartProps) {
  return (
    <ChartFrame loading={loading} height={height}>
      <RPieChart>
        <Tooltip contentStyle={tooltipStyle} />
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
      </RPieChart>
    </ChartFrame>
  );
}
