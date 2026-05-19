import type { Metadata } from "next";
import { Activity, Database, EyeOff, GitPullRequest, Scale, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { baseMetadata } from "@/lib/seo";

export const metadata: Metadata = baseMetadata({
  title: "How HydRent data works",
  description:
    "HydRent verification, trust scoring, moderation, privacy, and rent aggregation methodology.",
  alternates: { canonical: "/how-data-works" },
});

const sections = [
  {
    icon: ShieldCheck,
    title: "Submission trust",
    text: "Each rent signal receives a trust score from identity checks, proof availability, account age, consistency, historical reliability, community agreement, and anomaly resistance.",
  },
  {
    icon: Scale,
    title: "Weighted medians",
    text: "HydRent avoids simple averages. Closed rents receive higher weight, stale data decays, and suspicious outliers have reduced influence.",
  },
  {
    icon: Activity,
    title: "Anomaly detection",
    text: "Z-score, interquartile range, and median absolute deviation checks flag rent spikes, repeated fake patterns, and locality manipulation attempts.",
  },
  {
    icon: GitPullRequest,
    title: "Community moderation",
    text: "Moderation is modeled like open-source review: transparent events, reputation-weighted votes, duplicate merges, dispute trails, and reversible decisions.",
  },
  {
    icon: EyeOff,
    title: "Privacy model",
    text: "Public pages never expose flat numbers, tenant identities, proof files, agreements, or personal details. Evidence is private verification material.",
  },
  {
    icon: Database,
    title: "Data lineage",
    text: "Seeded estimates, manually verified submissions, and community-verified rents are separately labeled so users can understand evidence quality.",
  },
];

export default function HowDataWorksPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="max-w-3xl">
        <Badge variant="trust">Transparent methodology</Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-normal sm:text-4xl">
          How HydRent decides what to trust
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          HydRent is designed as a civic data system, not a listing marketplace. Numbers are
          aggregated from evidence-weighted submissions, checked for statistical anomalies, and
          published with confidence context.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <section.icon className="size-4 text-primary" aria-hidden="true" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{section.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="mt-8 rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold tracking-normal">Weighting model</h2>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
          {[
            ["Closed rent", "Highest evidence quality"],
            ["Renewed rent", "Strong but tenant-specific"],
            ["Asking rent", "Discounted until validated"],
            ["Old data", "Decays over time"],
          ].map(([label, text]) => (
            <div key={label} className="rounded-md border bg-muted/30 p-3">
              <p className="font-medium">{label}</p>
              <p className="mt-1 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
