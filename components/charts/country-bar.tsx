"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CountryCount } from "@/lib/analytics";

export function CountryBarChart({ data }: { data: CountryCount[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E3E8F0" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#5B6B85" }} />
        <YAxis
          type="category"
          dataKey="country"
          width={90}
          tick={{ fontSize: 12, fill: "#16233B" }}
        />
        <Tooltip
          cursor={{ fill: "#F4F6FA" }}
          contentStyle={{ borderRadius: 10, border: "1px solid #E3E8F0", fontSize: 12 }}
        />
        <Bar dataKey="count" name="Tools" fill="#00A88E" radius={[0, 6, 6, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
