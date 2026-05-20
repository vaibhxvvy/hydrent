"use client";

import { useEffect, useState } from "react";
import { formatINR } from "@/lib/utils";

type RecentSubmission = {
  bhk: string;
  locality: string;
  rent: number;
  trustScore: number;
  timeAgo: string;
};

export function HeroCards() {
  const [submissions, setSubmissions] = useState<RecentSubmission[]>([]);

  useEffect(() => {
    async function fetchRecent() {
      try {
        const res = await fetch("/api/stats/recent-submissions");
        if (res.ok) {
          const data = await res.json();
          setSubmissions(data);
        }
      } catch {
        // silent
      }
    }
    fetchRecent();
  }, []);

  if (submissions.length === 0) return null;

  return (
    <div className="relative flex flex-col gap-3">
      <div className="absolute inset-0 bg-[#22c55e]/5 blur-[60px] rounded-3xl" />
      <div className="animate-float relative rounded-xl border border-[#1f2b1f] bg-[#111811] p-5 shadow-[0_4px_24px_rgba(34,197,94,0.08)]">
        <div className="flex items-center gap-2 text-sm text-[#4b7a4b]">
          <span className="size-1.5 rounded-full bg-[#22c55e]" />
          Latest submission
        </div>
        <p className="mt-2 font-mono text-2xl font-bold text-[#f0fdf4]">
          {submissions[0]?.bhk} in {submissions[0]?.locality}
        </p>
        <p className="mt-1 font-mono text-3xl font-bold text-[#22c55e]">
          {formatINR(submissions[0]?.rent ?? 0)}
        </p>
        <div className="mt-3 flex items-center gap-3 text-sm">
          <span className="text-[#22c55e]">Trust {submissions[0]?.trustScore} ✓</span>
          <span className="text-[#4b7a4b]">·</span>
          <span className="text-[#4b7a4b]">Submitted {submissions[0]?.timeAgo}</span>
        </div>
      </div>
      {submissions.length > 1 && (
        <div className="animate-float relative -mt-2 ml-4 rounded-xl border border-[#1f2b1f] bg-[#111811] p-4 shadow-[0_4px_24px_rgba(34,197,94,0.08)]" style={{ animationDelay: "0.5s" }}>
          <p className="font-mono text-lg font-bold text-[#f0fdf4]">
            {submissions[1]?.bhk} in {submissions[1]?.locality}
          </p>
          <div className="mt-1 flex items-center gap-3 text-sm">
            <span className="font-mono text-xl font-bold text-[#22c55e]">
              {formatINR(submissions[1]?.rent ?? 0)}
            </span>
            <span className="text-[#22c55e]">Trust {submissions[1]?.trustScore} ✓</span>
          </div>
        </div>
      )}
    </div>
  );
}
