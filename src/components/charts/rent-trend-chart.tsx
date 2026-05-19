"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/types";
import { formatINR } from "@/lib/utils";

export function RentTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="rentBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3f8f79" stopOpacity={0.24} />
              <stop offset="95%" stopColor="#3f8f79" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tickFormatter={(value) => formatINR(Number(value), { compact: true })}
          />
          <Tooltip
            cursor={{ stroke: "var(--color-primary)", strokeWidth: 1 }}
            formatter={(value, name) => [
              formatINR(Number(value)),
              name === "medianRent" ? "Median" : String(name),
            ]}
            contentStyle={{
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              boxShadow: "0 10px 30px rgb(0 0 0 / 0.08)",
            }}
          />
          <Area
            type="monotone"
            dataKey="p75"
            stroke="transparent"
            fill="url(#rentBand)"
            activeDot={false}
          />
          <Area
            type="monotone"
            dataKey="medianRent"
            stroke="var(--color-primary)"
            strokeWidth={2}
            fill="transparent"
            dot={{ r: 3, fill: "var(--color-primary)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
