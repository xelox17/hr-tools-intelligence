"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ScopeCount } from "@/lib/analytics";
import { SCOPE_COLORS } from "@/lib/chart-colors";

export function ScopeDonutChart({ data }: { data: ScopeCount[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="scope"
          innerRadius={70}
          outerRadius={100}
          paddingAngle={3}
          cornerRadius={6}
          strokeWidth={0}
        >
          {data.map((entry) => (
            <Cell key={entry.scope} fill={SCOPE_COLORS[entry.scope]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 10, border: "1px solid #E3E8F0", fontSize: 12 }}
        />
        <Legend
          verticalAlign="bottom"
          height={32}
          iconType="circle"
          formatter={(value: string) => (
            <span style={{ color: "#16233B", fontSize: 12 }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
