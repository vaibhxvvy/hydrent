import type { Metadata } from "next";
import { Activity, Database, EyeOff, GitPullRequest, Scale, ShieldCheck } from "lucide-react";
import { baseMetadata } from "@/lib/seo";

export const metadata: Metadata = baseMetadata({
  title: "How HydRent data works",
  description: "HydRent verification, trust scoring, moderation, privacy, and rent aggregation methodology.",
  alternates: { canonical: "/how-data-works" },
});

const sections = [
  { icon: ShieldCheck, title: "Submission trust", text: "Each rent signal receives a trust score from identity checks, proof availability, account age, consistency, historical reliability, community agreement, and anomaly resistance." },
  { icon: Scale, title: "Weighted medians", text: "HydRent avoids simple averages. Closed rents receive higher weight, stale data decays, and suspicious outliers have reduced influence." },
  { icon: Activity, title: "Anomaly detection", text: "Z-score, interquartile range, and median absolute deviation checks flag rent spikes, repeated fake patterns, and locality manipulation attempts." },
  { icon: GitPullRequest, title: "Community moderation", text: "Moderation is modeled like open-source review: transparent events, reputation-weighted votes, duplicate merges, dispute trails, and reversible decisions." },
  { icon: EyeOff, title: "Privacy model", text: "Public pages never expose flat numbers, tenant identities, proof files, agreements, or personal details. Evidence is private verification material." },
  { icon: Database, title: "Scoring model", text: "Rent type: closed=40pts, renewal=30, asking=20. Proof: +20. Submitter: tenant=15, owner=10, broker=0. Consensus: +15. Recency: +10. Brokers capped at 30." },
];

export default function HowDataWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <ShieldCheck className="mx-auto size-10 text-[#22c55e]" />
        <h1 className="mt-4 text-3xl font-bold text-[#f0fdf4]">How HydRent data works</h1>
        <p className="mt-3 max-w-2xl text-[#86efac]">
          Open-source-inspired verification without a single truth gatekeeper.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {sections.map((s) => (
          <div key={s.title} className="rounded-xl border border-[#1f2b1f] bg-[#111811] p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-[#1a221a]">
                <s.icon className="size-4 text-[#22c55e]" />
              </span>
              <h2 className="font-semibold text-[#f0fdf4]">{s.title}</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#86efac]">{s.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-[#22c55e]/30 bg-[#111811] p-6">
        <h2 className="text-lg font-bold text-[#f0fdf4]">Weighting model</h2>
        <div className="mt-4 space-y-3">
          {[
            ["Rent type", "Closed deal 40pts · Renewal 30pts · Asking 20pts"],
            ["Proof submitted", "+20 trust points"],
            ["Submitter type", "Tenant +15 · Owner +10 · Broker +0"],
            ["Nearby consensus", "+15 points within 1km of similar flats"],
            ["Recency", "+10 points if submitted within 30 days"],
            ["Broker cap", "Broker submissions capped at 30/100 max"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-lg bg-[#1a221a] px-4 py-3 text-sm">
              <span className="text-[#4b7a4b]">{label}</span>
              <span className="text-[#f0fdf4]">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
