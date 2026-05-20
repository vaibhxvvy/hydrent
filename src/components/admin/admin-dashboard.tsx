"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, Flag, RefreshCw, Trash2 } from "lucide-react";

type Submission = import("@/lib/types").RentSubmission;
type LocalityStats = {
  id: string;
  name: string;
  slug: string;
  submissionCount: number;
  confidenceScore: number;
  median2BHK: number | null;
  lastUpdated: Date | null;
  scrapedCount: number;
};

type Tab = "dashboard" | "submissions" | "localities" | "scraper" | "settings";

function timeAgo(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export function AdminDashboard({ submissions, localities }: { submissions: Submission[]; localities: LocalityStats[] }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [selectedSubs, setSelectedSubs] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>("all");
  const [activityFeed, setActivityFeed] = useState<Array<{ id: string; text: string; time: string }>>([]);
  const [scraperRunning, setScraperRunning] = useState(false);
  const [scraperResult, setScraperResult] = useState<string | null>(null);

  // Live activity feed
  const refreshActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/stats/recent-submissions");
      if (res.ok) {
        const data = await res.json();
        setActivityFeed(
          data.map((s: { bhk: string; locality: string; rent: number; timeAgo: string }) => ({
            id: `${s.bhk}-${s.locality}-${Date.now()}`,
            text: `${s.bhk} ${s.locality} ₹${s.rent.toLocaleString()}`,
            time: s.timeAgo,
          })),
        );
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    refreshActivity();
    const interval = setInterval(refreshActivity, 30000);
    return () => clearInterval(interval);
  }, [refreshActivity]);

  const handleBulkAction = async (action: "APPROVE" | "REJECT" | "FLAG") => {
    for (const id of selectedSubs) {
      await fetch("/api/admin/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: id, action }),
      });
    }
    setSelectedSubs(new Set());
    refreshActivity();
  };

  const handleRunScraper = async () => {
    setScraperRunning(true);
    setScraperResult(null);
    try {
      const res = await fetch("/api/admin/run-scraper", { method: "POST" });
      const data = await res.json();
      setScraperResult(data.message || "Scraper completed");
    } catch {
      setScraperResult("Error running scraper");
    } finally {
      setScraperRunning(false);
    }
  };

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "dashboard", label: "Dashboard" },
    { id: "submissions", label: "Submissions" },
    { id: "localities", label: "Localities" },
    { id: "scraper", label: "Scraper" },
    { id: "settings", label: "Settings" },
  ];

  const filteredSubmissions = submissions.filter((s) => {
    if (filter === "all") return true;
    if (filter === "pending") return s.verificationState === "PENDING_REVIEW";
    if (filter === "approved") return s.verificationState === "VERIFIED";
    if (filter === "flagged") return (s.anomalyScore ?? 0) >= 50;
    if (filter === "rejected") return s.verificationState === "REJECTED";
    if (filter === "scraped") return s.sourceType === "LISTING_ESTIMATE";
    return true;
  });

  const flagged = submissions.filter((s) => (s.anomalyScore ?? 0) >= 50).length;
  const pending = submissions.filter((s) => s.verificationState === "PENDING_REVIEW").length;
  const approvedThisWeek = submissions.filter((s) => {
    const weekAgo = Date.now() - 7 * 86400000;
    return s.verificationState === "VERIFIED" && new Date(s.submittedAt).getTime() > weekAgo;
  }).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">Admin Panel</h1>
        <p className="mt-1 text-sm text-[var(--md-sys-color-on-surface-variant)]">Moderation, scraper management, and locality health.</p>
      </div>

      {/* Tab navigation */}
      <div className="mb-6 flex gap-1 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]" : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* DASHBOARD TAB */}
      {tab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-4">
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Total submissions</p>
              <p className="mt-1 font-mono text-2xl font-bold text-[var(--md-sys-color-on-surface)]">{submissions.length}</p>
            </div>
            <div className="rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-4">
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Pending review</p>
              <p className={`mt-1 font-mono text-2xl font-bold ${pending > 5 ? "text-[var(--md-sys-color-error)]" : "text-[#eab308]"}`}>{pending}</p>
            </div>
            <div className="rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-4">
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Approved this week</p>
              <p className="mt-1 font-mono text-2xl font-bold text-[var(--md-sys-color-primary)]">{approvedThisWeek}</p>
            </div>
            <div className="rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-4">
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Flagged</p>
              <p className={`mt-1 font-mono text-2xl font-bold ${flagged > 0 ? "text-[var(--md-sys-color-error)]" : "text-[var(--md-sys-color-primary)]"}`}>{flagged}</p>
            </div>
          </div>

          {/* Activity feed */}
          <div className="rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-5">
            <h2 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">Live activity feed</h2>
            <div className="mt-3 space-y-2">
              {activityFeed.length > 0 ? (
                activityFeed.slice(0, 10).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg bg-[var(--md-sys-color-surface-container-high)] px-3 py-2 text-sm">
                    <span className="text-[var(--md-sys-color-on-surface-variant)]">{item.text}</span>
                    <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{item.time}</span>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-sm text-[var(--md-sys-color-on-surface-variant)]">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBMISSIONS TAB */}
      {tab === "submissions" && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="flex flex-wrap gap-2">
            {["all", "pending", "approved", "flagged", "rejected", "scraped"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]" : "border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Bulk actions */}
          {selectedSubs.size > 0 && (
            <div className="flex gap-2">
              <button onClick={() => handleBulkAction("APPROVE")} className="rounded-lg bg-[var(--md-sys-color-primary)] px-3 py-1.5 text-xs font-medium text-[var(--md-sys-color-on-primary)] hover:brightness-110">
                Approve selected ({selectedSubs.size})
              </button>
              <button onClick={() => handleBulkAction("FLAG")} className="rounded-lg bg-[var(--md-sys-color-tertiary)] px-3 py-1.5 text-xs font-medium text-[var(--md-sys-color-on-primary)] hover:bg-[#d9a406]">
                Flag selected
              </button>
              <button onClick={() => handleBulkAction("REJECT")} className="rounded-lg bg-[#ef4444] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#dc2626]">
                Reject selected
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-[var(--md-sys-color-outline)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)]">
                  <th className="px-3 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) setSelectedSubs(new Set(filteredSubmissions.map((s) => s.id)));
                        else setSelectedSubs(new Set());
                      }}
                      className="accent-[var(--md-sys-color-primary)]"
                    />
                  </th>
                  <th className="px-3 py-3 text-left font-medium text-[var(--md-sys-color-on-surface-variant)]">Locality</th>
                  <th className="px-3 py-3 text-left font-medium text-[var(--md-sys-color-on-surface-variant)]">BHK</th>
                  <th className="px-3 py-3 text-left font-medium text-[var(--md-sys-color-on-surface-variant)]">Rent</th>
                  <th className="px-3 py-3 text-left font-medium text-[var(--md-sys-color-on-surface-variant)]">Trust</th>
                  <th className="px-3 py-3 text-left font-medium text-[var(--md-sys-color-on-surface-variant)]">Type</th>
                  <th className="px-3 py-3 text-left font-medium text-[var(--md-sys-color-on-surface-variant)]">Source</th>
                  <th className="px-3 py-3 text-left font-medium text-[var(--md-sys-color-on-surface-variant)]">Date</th>
                  <th className="px-3 py-3 text-left font-medium text-[var(--md-sys-color-on-surface-variant)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.length > 0 ? (
                  filteredSubmissions.slice(0, 50).map((sub) => (
                    <tr key={sub.id} className="border-b border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors">
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedSubs.has(sub.id)}
                          onChange={() => {
                            const next = new Set(selectedSubs);
                            if (next.has(sub.id)) next.delete(sub.id);
                            else next.add(sub.id);
                            setSelectedSubs(next);
                          }}
                          className="accent-[var(--md-sys-color-primary)]"
                        />
                      </td>
                      <td className="px-3 py-3 text-[var(--md-sys-color-on-surface)]">{sub.localitySlug}</td>
                      <td className="px-3 py-3 font-mono text-[var(--md-sys-color-on-surface)]">{sub.bhk}</td>
                      <td className="px-3 py-3 font-mono text-[var(--md-sys-color-primary)]">₹{sub.rentAmount.toLocaleString()}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          sub.trustScore >= 70 ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]" : sub.trustScore >= 40 ? "bg-[var(--md-sys-color-tertiary)] text-[var(--md-sys-color-on-primary)]" : "bg-[#ef4444] text-white"
                        }`}>
                          {sub.trustScore}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[var(--md-sys-color-on-surface-variant)]">{sub.rentType}</td>
                      <td className="px-3 py-3 text-[var(--md-sys-color-on-surface-variant)]">{sub.sourceType}</td>
                      <td className="px-3 py-3 text-[var(--md-sys-color-on-surface-variant)]">{timeAgo(sub.submittedAt)}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          <button className="rounded p-1 text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-high)]" title="Approve"><Check className="size-3.5" /></button>
                          <button className="rounded p-1 text-[#eab308] hover:bg-[var(--md-sys-color-surface-container-high)]" title="Flag"><Flag className="size-3.5" /></button>
                          <button className="rounded p-1 text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-surface-container-high)]" title="Reject"><Trash2 className="size-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-3 py-12 text-center text-[var(--md-sys-color-on-surface-variant)]">No submissions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LOCALITIES TAB */}
      {tab === "localities" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{localities.length} localities</p>
            <button className="flex items-center gap-1 rounded-lg border border-[var(--md-sys-color-outline)] px-3 py-1.5 text-sm text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors">
              <RefreshCw className="size-3.5" />
              Recalculate all
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[var(--md-sys-color-outline)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)]">
                  <th className="px-3 py-3 text-left font-medium text-[var(--md-sys-color-on-surface-variant)]">Locality</th>
                  <th className="px-3 py-3 text-left font-medium text-[var(--md-sys-color-on-surface-variant)]">Submissions</th>
                  <th className="px-3 py-3 text-left font-medium text-[var(--md-sys-color-on-surface-variant)]">Scraped</th>
                  <th className="px-3 py-3 text-left font-medium text-[var(--md-sys-color-on-surface-variant)]">Confidence</th>
                  <th className="px-3 py-3 text-left font-medium text-[var(--md-sys-color-on-surface-variant)]">Last updated</th>
                </tr>
              </thead>
              <tbody>
                {localities.map((loc) => (
                  <tr key={loc.id} className="border-b border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors">
                    <td className="px-3 py-3 font-medium text-[var(--md-sys-color-on-surface)]">{loc.name}</td>
                    <td className="px-3 py-3 font-mono text-[var(--md-sys-color-on-surface)]">{loc.submissionCount}</td>
                    <td className="px-3 py-3 text-[var(--md-sys-color-on-surface-variant)]">{loc.scrapedCount}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        loc.confidenceScore >= 70 ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]" : loc.confidenceScore >= 40 ? "bg-[var(--md-sys-color-tertiary)] text-[var(--md-sys-color-on-primary)]" : "bg-[#ef4444] text-white"
                      }`}>
                        {loc.confidenceScore}/100
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[var(--md-sys-color-on-surface-variant)]">{loc.lastUpdated ? timeAgo(loc.lastUpdated) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SCRAPER TAB */}
      {tab === "scraper" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-6">
            <h2 className="text-lg font-semibold text-[var(--md-sys-color-on-surface)]">Scraper Management</h2>
            <p className="mt-1 text-sm text-[var(--md-sys-color-on-surface-variant)]">Generate seed listings for all localities.</p>

            <button
              onClick={handleRunScraper}
              disabled={scraperRunning}
              className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--md-sys-color-primary)] px-5 py-2.5 text-sm font-medium text-[var(--md-sys-color-on-primary)] hover:brightness-110 transition-colors disabled:opacity-50"
            >
              {scraperRunning ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <ExternalLink className="size-4" />
                  Run scraper
                </>
              )}
            </button>

            {scraperResult && (
              <div className="mt-4 rounded-lg border border-[#22c55e]/30 bg-[var(--md-sys-color-surface-container-high)] p-3 text-sm text-[var(--md-sys-color-on-surface-variant)]">
                {scraperResult}
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-on-primary)] p-4">
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Total scraped</p>
                <p className="mt-1 font-mono text-xl font-bold text-[var(--md-sys-color-on-surface)]">{localities.reduce((a, l) => a + l.scrapedCount, 0)}</p>
              </div>
              <div className="rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-on-primary)] p-4">
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Localities covered</p>
                <p className="mt-1 font-mono text-xl font-bold text-[var(--md-sys-color-on-surface)]">{localities.filter((l) => l.scrapedCount > 0).length}</p>
              </div>
              <div className="rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-on-primary)] p-4">
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Last scrape</p>
                <p className="mt-1 font-mono text-xl font-bold text-[var(--md-sys-color-on-surface)]">—</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {tab === "settings" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--md-sys-color-on-surface)]">Show scraped data disclaimer</p>
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Display disclaimer on locality pages about scraped listing data.</p>
              </div>
              <div className="h-6 w-11 rounded-full bg-[var(--md-sys-color-primary)] p-0.5 transition-colors">
                <div className="h-5 w-5 rounded-full bg-white shadow-sm ml-auto" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--md-sys-color-on-surface)]">Min submissions to show on homepage</p>
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Current: 1</p>
              </div>
              <input type="number" defaultValue={1} min={0} max={10} className="w-20 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-on-primary)] px-3 py-1.5 text-sm text-[var(--md-sys-color-on-surface)] outline-none focus:border-[#22c55e]" />
            </div>
          </div>

          <div className="rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--md-sys-color-on-surface)]">Admin email for notifications</p>
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">labusepc@gmail.com</p>
              </div>
              <input type="email" defaultValue="labusepc@gmail.com" className="w-64 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-on-primary)] px-3 py-1.5 text-sm text-[var(--md-sys-color-on-surface)] outline-none focus:border-[#22c55e]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
