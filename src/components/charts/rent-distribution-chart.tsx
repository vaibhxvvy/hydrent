"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RentSubmission } from "@/lib/types";
import { formatINR } from "@/lib/utils";

export function RentDistributionChart({ submissions }: { submissions: RentSubmission[] }) {
  const buckets = [
    { label: "<30k", min: 0, max: 30000 },
    { label: "30-45k", min: 30000, max: 45000 },
    { label: "45-60k", min: 45000, max: 60000 },
    { label: "60-80k", min: 60000, max: 80000 },
    { label: "80k+", min: 80000, max: Number.POSITIVE_INFINITY },
  ].map((bucket) => ({
    label: bucket.label,
    count: submissions.filter(
      (submission) =>
        submission.effectiveMonthlyCost >= bucket.min &&
        submission.effectiveMonthlyCost < bucket.max,
    ).length,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={buckets} margin={{ left: 0, right: 8, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip
            formatter={(value) => [`${value} submissions`, "Count"]}
            labelFormatter={(label) => `Rent band ${label}`}
            contentStyle={{
              border: "1px solid var(--color-border)",
              borderRadius: 8,
            }}
          />
          <Bar
            dataKey="count"
            fill="var(--color-primary)"
            radius={[5, 5, 0, 0]}
            aria-label={`Distribution from ${formatINR(0)} upward`}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
