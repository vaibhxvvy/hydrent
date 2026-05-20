import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ShieldAlert, MessageSquareWarning } from "lucide-react";
import { MetricCard } from "@/components/rent/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllSubmissions } from "@/lib/data/db";
import { baseMetadata } from "@/lib/seo";
import AdminLogin from "@/components/admin/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = baseMetadata({
  title: "Moderation dashboard",
  description: "Internal anomaly review, duplicate merging, trust graph, and locality health tooling.",
  robots: { index: false, follow: false },
});

export default async function AdminPage() {
  let submissions: import("@/lib/types").RentSubmission[] = [];
  try {
    submissions = await getAllSubmissions();
  } catch {
    // Database unavailable during build - show empty state
  }
  const flagged = submissions.filter((submission) => submission.anomalyScore >= 50).length;
  const stale = submissions.filter((submission) => submission.freshnessScore < 50).length;
  const pending = submissions.filter((s) => s.verificationState === "PENDING_REVIEW").length;

  const content = (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Moderation dashboard</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Internal tooling for anomaly review, suspicious submissions, and locality health.
        </p>
      </div>

      <div className="mt-4">
        <Button asChild variant="outline">
          <Link href="/admin/issues">
            <MessageSquareWarning className="mr-2 size-4" />
            View Issue Reports
          </Link>
        </Button>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={ShieldAlert} label="Flagged submissions" value={String(flagged)} detail="High anomaly pressure." />
        <MetricCard icon={Activity} label="Stale signals" value={String(stale)} detail="Low freshness influence." />
        <MetricCard icon={ShieldAlert} label="Total submissions" value={String(submissions.length)} detail="All non-rejected." />
        <MetricCard icon={ShieldAlert} label="Pending review" value={String(pending)} detail="Awaiting moderation." />
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent submissions</CardTitle>
          <CardDescription>Latest rent submissions for review.</CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-medium">BHK</th>
                    <th className="pb-2 text-left font-medium">Rent</th>
                    <th className="pb-2 text-left font-medium">Trust</th>
                    <th className="pb-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.slice(0, 20).map((sub) => (
                    <tr key={sub.id} className="border-b">
                      <td className="py-2">{sub.bhk}</td>
                      <td className="py-2">₹{sub.rentAmount.toLocaleString()}</td>
                      <td className="py-2">{sub.trustScore}</td>
                      <td className="py-2">
                        <span className={`rounded px-1.5 py-0.5 text-xs ${
                          sub.verificationState === "VERIFIED" ? "bg-green-100 text-green-800" :
                          sub.verificationState === "PENDING_REVIEW" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {sub.verificationState}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No submissions yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return <AdminLogin>{content}</AdminLogin>;
}
