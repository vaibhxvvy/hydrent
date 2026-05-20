"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export default function IssueReportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const err = await res.json();
        setError(err.error || "Something went wrong");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-[#22c55e]/20">
          <svg className="size-8 text-[#22c55e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline className="animate-checkmark" points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="mt-5 text-2xl font-bold text-[#f0fdf4]">Thank you</h1>
        <p className="mt-3 text-sm text-[#86efac]">We&apos;ll review your report and get back to you if needed.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-[#f0fdf4]">Report an Issue</h1>
      <p className="mt-2 text-sm text-[#86efac]">Help us improve HydRent by reporting bugs or suggesting features.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-[#f0fdf4]">Name</label>
          <input id="name" name="name" required className="h-11 w-full rounded-lg border border-[#2d3f2d] bg-[#111811] px-4 text-sm text-[#f0fdf4] placeholder-[#4b7a4b] outline-none focus:border-[#22c55e] focus:shadow-[0_0_0_3px_rgba(34,197,94,0.15)]" />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#f0fdf4]">Email</label>
          <input id="email" name="email" type="email" required className="h-11 w-full rounded-lg border border-[#2d3f2d] bg-[#111811] px-4 text-sm text-[#f0fdf4] placeholder-[#4b7a4b] outline-none focus:border-[#22c55e] focus:shadow-[0_0_0_3px_rgba(34,197,94,0.15)]" />
        </div>
        <div>
          <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-[#f0fdf4]">Subject</label>
          <input id="subject" name="subject" required className="h-11 w-full rounded-lg border border-[#2d3f2d] bg-[#111811] px-4 text-sm text-[#f0fdf4] placeholder-[#4b7a4b] outline-none focus:border-[#22c55e] focus:shadow-[0_0_0_3px_rgba(34,197,94,0.15)]" />
        </div>
        <div>
          <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-[#f0fdf4]">Message</label>
          <textarea id="message" name="message" rows={5} required className="w-full rounded-lg border border-[#2d3f2d] bg-[#111811] px-4 py-3 text-sm text-[#f0fdf4] placeholder-[#4b7a4b] outline-none focus:border-[#22c55e] focus:shadow-[0_0_0_3px_rgba(34,197,94,0.15)] resize-y" />
        </div>

        {error && <p className="text-sm text-[#ef4444]">{error}</p>}

        <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-lg bg-[#22c55e] px-5 py-2.5 text-sm font-medium text-[#0a0f0a] hover:bg-[#16a34a] transition-colors disabled:opacity-50">
          <Send className="size-4" />
          {loading ? "Sending..." : "Submit report"}
        </button>
      </form>
    </div>
  );
}
