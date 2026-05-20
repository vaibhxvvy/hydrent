"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/utils";

interface StatsData {
  totalSubmissions: number;
  localitiesWithData: number;
  closedRentPercentage: number;
  lastUpdated: string;
}

function timeAgo(date: string) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function StatsBar({ initial }: { initial: StatsData }) {
  const [stats, setStats] = useState(initial);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // silent fail
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-sm">
      <span className="text-[#f0fdf4]">{formatNumber(stats.totalSubmissions)} rents verified</span>
      <span className="text-[#22c55e]">·</span>
      <span className="text-[#f0fdf4]">{stats.localitiesWithData} localities</span>
      <span className="text-[#22c55e]">·</span>
      <span className="text-[#f0fdf4]">{stats.closedRentPercentage}% closed deals</span>
      <span className="text-[#22c55e]">·</span>
      <span className="text-[#4b7a4b]">Updated {timeAgo(stats.lastUpdated)}</span>
    </div>
  );
}
