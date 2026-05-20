"use client";

import { useEffect, useState } from "react";
import { formatINR } from "@/lib/utils";

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

  if (stats.totalSubmissions < 10) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-card px-4 py-3 text-sm">
      <span className="font-medium">{formatINR(stats.totalSubmissions)} rents submitted</span>
      <span className="text-muted-foreground">·</span>
      <span>{stats.localitiesWithData} localities covered</span>
      <span className="text-muted-foreground">·</span>
      <span>{stats.closedRentPercentage}% closed rents</span>
      <span className="text-muted-foreground">·</span>
      <span className="text-muted-foreground">Updated {timeAgo(stats.lastUpdated)}</span>
    </div>
  );
}
