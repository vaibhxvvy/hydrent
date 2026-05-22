"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-[#ef4444]/20">
        <span className="text-2xl">⚠</span>
      </div>
      <h1 className="mt-5 text-2xl font-bold text-[#f0fdf4]">Something went wrong</h1>
      <p className="mt-3 text-sm leading-6 text-[#86efac]">
        Try refreshing the page. If the problem persists, please report the issue.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-[#14B8A6] px-5 py-2.5 text-sm font-medium text-[#0a0f0a] hover:bg-[#0D9488] transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
