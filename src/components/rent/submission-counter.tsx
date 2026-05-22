"use client";

import { useEffect, useState } from "react";

export function SubmissionCounter({ totalSubmissions }: { totalSubmissions: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (totalSubmissions === 0) return;
    const duration = 800;
    const steps = 30;
    const increment = Math.max(1, Math.floor(totalSubmissions / steps));
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + increment, totalSubmissions);
      setCount(current);
      if (current >= totalSubmissions) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [totalSubmissions]);

  if (totalSubmissions === 0) return null;

  return (
    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--md-sys-color-primary)] opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-[var(--md-sys-color-primary)]" />
      </span>
      <span className="font-mono font-medium text-[var(--md-sys-color-on-surface)]">{count.toLocaleString("en-IN")}</span>
      <span>renters submitted this month</span>
    </div>
  );
}
