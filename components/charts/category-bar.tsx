"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategoryCount } from "@/lib/analytics";
import { getCategoryColor } from "@/lib/chart-colors";

export function CategoryBarChart({ data }: { data: CategoryCount[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E3E8F0" vertical={false} />
        <XAxis
          dataKey="category"
          tick={{ fontSize: 11, fill: "#5B6B85" }}
          angle={-25}
          textAnchor="end"
          height={64}
          interval={0}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#5B6B85" }} />
        <Tooltip
          cursor={{ fill: "#F4F6FA" }}
          contentStyle={{
            borderRadius: 10,
            border: "1px solid #E3E8F0",
            fontSize: 12,
          }}
        />
        <Bar dataKey="count" name="Tools" radius={[6, 6, 0, 0]} maxBarSize={40}>
          {data.map((entry) => (
            <Cell key={entry.category} fill={getCategoryColor(entry.category)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
