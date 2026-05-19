import type { Metadata } from "next";
import { Activity, Blocks, ShieldAlert, Split } from "lucide-react";
import { ModerationTable } from "@/components/admin/moderation-table";
import { MetricCard } from "@/components/rent/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { moderationQueue, rentSubmissions } from "@/lib/data/hyderabad";
import { baseMetadata } from "@/lib/seo";

export const metadata: Metadata = baseMetadata({
  title: "Moderation dashboard",
  description: "Internal anomaly review, duplicate merging, trust graph, and locality health tooling.",
  robots: { index: false, follow: false },
});

export default function AdminPage() {
  const flagged = rentSubmissions.filter((submission) => submission.anomalyScore >= 50).length;
  const stale = rentSubmissions.filter((submission) => submission.freshnessScore < 50).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Moderation dashboard</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Internal tooling foundation for anomaly review, suspicious submissions, trust graph
          monitoring, stale data detection, duplicate building merging, and locality health.
        </p>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={ShieldAlert}
          label="Flagged submissions"
          value={String(flagged)}
          detail="High anomaly pressure or low-trust clusters."
        />
        <MetricCard
          icon={Activity}
          label="Stale signals"
          value={String(stale)}
          detail="Records with low freshness influence."
        />
        <MetricCard
          icon={Split}
          label="Merge candidates"
          value="1"
          detail="Alias clusters awaiting building normalization."
        />
        <MetricCard
          icon={Blocks}
          label="Queue depth"
          value={String(moderationQueue.length)}
          detail="Open moderation events in this seed dataset."
        />
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Anomaly review queue</CardTitle>
          <CardDescription>Sortable TanStack Table foundation for moderation workflows.</CardDescription>
        </CardHeader>
        <CardContent>
          <ModerationTable data={moderationQueue} />
        </CardContent>
      </Card>
    </div>
  );
}
