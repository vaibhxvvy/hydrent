import type { Metadata } from "next";
import { Activity, Database, EyeOff, GitPullRequest, Scale, ShieldCheck, Lock, BarChart3 } from "lucide-react";
import Link from "next/link";
import { baseMetadata } from "@/lib/seo";

export const metadata: Metadata = baseMetadata({
  title: "How data works",
  description: "HydRent verification, trust scoring, moderation, privacy, and rent aggregation methodology.",
  alternates: { canonical: "/how-data-works" },
});

const factors = [
  { label: "Rent type", detail: "Closed deal 40pts · Renewal 30pts · Asking 20pts", max: 40, color: "var(--md-sys-color-primary)" },
  { label: "Proof submitted", detail: "+20 trust points", max: 20, color: "var(--md-sys-color-primary)" },
  { label: "Submitter type", detail: "Tenant +15 · Owner +10 · Broker +0", max: 15, color: "var(--md-sys-color-tertiary)" },
  { label: "Nearby consensus", detail: "+15 points within 1km of similar flats", max: 15, color: "var(--md-sys-color-tertiary)" },
  { label: "Recency", detail: "+10 points if submitted within 30 days", max: 10, color: "var(--md-sys-color-secondary)" },
];

const sections = [
  { icon: ShieldCheck, title: "Submission trust", text: "Each rent signal receives a trust score from identity checks, proof availability, account age, consistency, historical reliability, community agreement, and anomaly resistance." },
  { icon: Scale, title: "Weighted medians", text: "HydRent avoids simple averages. Closed rents receive higher weight, stale data decays, and suspicious outliers have reduced influence." },
  { icon: Activity, title: "Anomaly detection", text: "Z-score, interquartile range, and median absolute deviation checks flag rent spikes, repeated fake patterns, and locality manipulation attempts." },
  { icon: GitPullRequest, title: "Community moderation", text: "Moderation is modeled like open-source review: transparent events, reputation-weighted votes, duplicate merges, dispute trails, and reversible decisions." },
];

const privacyItems = [
  { label: "Public", items: ["Locality", "BHK type", "Rent amount range", "Furnishing type", "Aggregated statistics"] },
  { label: "Private", items: ["Your exact address", "Proof documents", "Personal identity", "Email address", "Move-in date"] },
];

export default function HowDataWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {/* Hero */}
      <div className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--md-sys-color-primary)]/10">
          <ShieldCheck className="size-7 text-[var(--md-sys-color-primary)]" />
        </div>
        <h1 className="mt-5 font-display text-4xl font-semibold text-[var(--md-sys-color-on-surface)] sm:text-5xl">
          Built for transparency
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--md-sys-color-on-surface-variant)]">
          Open-source-inspired verification without a single truth gatekeeper. Every number you see is backed by a trust-weighted system.
        </p>
      </div>

      {/* Scoring Breakdown */}
      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--md-sys-color-on-surface)]">
          <BarChart3 className="size-5 text-[var(--md-sys-color-primary)]" />
          Scoring breakdown
        </h2>
        <p className="mt-1 text-sm text-[var(--md-sys-color-on-surface-variant)]">How each submission&apos;s trust score is calculated</p>

        <div className="mt-6 rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] overflow-hidden">
          <div className="divide-y divide-[var(--md-sys-color-outline)]">
            {factors.map((f) => (
              <div key={f.label} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{f.label}</p>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{f.detail}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] w-14 text-right">{f.max} pts max</span>
                  <div className="w-24 h-2 rounded-full bg-[var(--md-sys-color-surface-container-highest)] overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(f.max / 40) * 100}%`, background: f.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] px-5 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-[var(--md-sys-color-on-surface)]">Max possible (tenant + proof)</span>
              <span className="font-mono font-bold text-[var(--md-sys-color-primary)]">100 pts</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Broker cap</span>
              <span className="font-mono text-[var(--md-sys-color-tertiary)]">30 pts max</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works grid */}
      <section className="mt-12">
        <h2 className="text-lg font-semibold text-[var(--md-sys-color-on-surface)]">How it works</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {sections.map((s) => (
            <div key={s.title} className="rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--md-sys-color-surface-container-high)]">
                  <s.icon className="size-4 text-[var(--md-sys-color-primary)]" />
                </span>
                <h3 className="font-semibold text-[var(--md-sys-color-on-surface)]">{s.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy model */}
      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--md-sys-color-on-surface)]">
          <Lock className="size-5 text-[var(--md-sys-color-primary)]" />
          Privacy model
        </h2>
        <p className="mt-1 text-sm text-[var(--md-sys-color-on-surface-variant)]">What is and isn&apos;t public</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[--radius-card] border border-[var(--md-sys-color-primary)]/20 bg-[var(--md-sys-color-primary)]/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <EyeOff className="size-4 text-[var(--md-sys-color-primary)]" />
              <h3 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">Public</h3>
            </div>
            <ul className="space-y-2">
              {privacyItems[0]!.items.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
                  <span className="size-1.5 rounded-full bg-[var(--md-sys-color-primary)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="size-4 text-[var(--md-sys-color-tertiary)]" />
              <h3 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">Private</h3>
            </div>
            <ul className="space-y-2">
              {privacyItems[1]!.items.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
                  <span className="size-1.5 rounded-full bg-[var(--md-sys-color-tertiary)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ accordion */}
      <section className="mt-12">
        <h2 className="text-lg font-semibold text-[var(--md-sys-color-on-surface)]">Frequently Asked Questions</h2>
        <div className="mt-4 space-y-3">
          {[
            ["Why does HydRent differ from 99acres/MagicBricks?", "Those sites show asking prices from brokers and owners. HydRent shows actual rents paid by tenants — verified, closed deals only. The difference can be 15–30%."],
            ["How is the median calculated?", "We use a trust-weighted median. Each submission gets a trust score based on lease type, proof, recency, and nearby consensus. Higher trust submissions influence the median more. Standard percentile bands (P25, P75) show the range."],
            ["Can my landlord identify me?", "No. Submissions are completely anonymous. No personal information is collected or stored. Public pages only show aggregated statistics, never individual data points."],
            ["What happens if someone submits fake data?", "Our anomaly detection flags suspicious submissions using z-score, IQR, and MAD checks. Low-trust or outlier submissions are deprioritized in the weighted median calculation."],
            ["How can I contribute?", "Submit your rent data anonymously. The more submissions from a locality, the more accurate and useful the data becomes. You can also report issues or suggest features."],
          ].map(([q, a]) => (
            <details key={q} className="rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-4 group">
              <summary className="cursor-pointer text-sm font-medium text-[var(--md-sys-color-on-surface)] list-none">{q}</summary>
              <p className="mt-2 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-12 text-center">
        <Link href="/submit" className="inline-flex items-center gap-2 rounded-[--radius-button] bg-[var(--md-sys-color-primary)] px-6 py-3 text-sm font-medium text-[var(--md-sys-color-on-primary)] hover:brightness-110 transition-all">
          Submit your rent
        </Link>
      </div>
    </div>
  );
}
