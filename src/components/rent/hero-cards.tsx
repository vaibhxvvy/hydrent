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
      <div className="absolute inset-0 bg-[var(--md-sys-color-primary)]/5 blur-[60px] rounded-3xl" />
      <div className="animate-float relative rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-2)] p-5 shadow-level-2">
        <div className="flex items-center gap-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
          <span className="size-1.5 rounded-full bg-[var(--md-sys-color-secondary)]" />
          Latest submission
        </div>
        <p className="mt-2 font-mono text-2xl font-bold text-[var(--md-sys-color-on-surface)]">
          {submissions[0]?.bhk} in {submissions[0]?.locality}
        </p>
        <p className="mt-1 font-mono text-3xl font-bold text-[var(--md-sys-color-primary)]">
          {formatINR(submissions[0]?.rent ?? 0)}
        </p>
        <div className="mt-3 flex items-center gap-3 text-sm">
          <span className="text-[var(--md-sys-color-secondary)]">Trust {submissions[0]?.trustScore} ✓</span>
          <span className="text-[var(--md-sys-color-on-surface-variant)]">·</span>
          <span className="text-[var(--md-sys-color-on-surface-variant)]">Submitted {submissions[0]?.timeAgo}</span>
        </div>
      </div>
      {submissions.length > 1 && (
        <div className="animate-float relative -mt-2 ml-4 rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-4 shadow-level-1" style={{ animationDelay: "0.5s" }}>
          <p className="font-mono text-lg font-bold text-[var(--md-sys-color-on-surface)]">
            {submissions[1]?.bhk} in {submissions[1]?.locality}
          </p>
          <div className="mt-1 flex items-center gap-3 text-sm">
            <span className="font-mono text-xl font-bold text-[var(--md-sys-color-primary)]">
              {formatINR(submissions[1]?.rent ?? 0)}
            </span>
            <span className="text-[var(--md-sys-color-secondary)]">Trust {submissions[1]?.trustScore} ✓</span>
          </div>
        </div>
      )}
    </div>
  );
}
