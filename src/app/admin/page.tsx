import type { Metadata } from "next";
import AdminLogin from "@/components/admin/admin-auth";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getAllSubmissions } from "@/lib/data/db";
import { getSupabaseServer } from "@/lib/db";
import { baseMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = baseMetadata({
  title: "Admin dashboard",
  description: "Internal moderation, scraper management, and locality health tooling.",
  robots: { index: false, follow: false },
});

export default async function AdminPage() {
  let submissions: import("@/lib/types").RentSubmission[] = [];
  let localities: Array<{ id: string; name: string; slug: string; submissionCount: number; confidenceScore: number; median2BHK: number | null; lastUpdated: Date | null; scrapedCount: number }> = [];

  try {
    submissions = await getAllSubmissions();
    const supabase = getSupabaseServer();
    const { data: dbLocalities } = await supabase
      .from("Locality")
      .select("*, zone:Zone(name), rentSubmissions:RentSubmission(id, trustScore, verificationState, submittedAt, sourceType)")
      .order("name", { ascending: true });

    localities = ((dbLocalities || []) as Array<Record<string, unknown>>).map((l: Record<string, unknown>) => {
      const locSubs = (l.rentSubmissions || []) as Array<Record<string, unknown>>;
      const verifiedSubs = locSubs.filter((s) => ["VERIFIED", "COMMUNITY_REVIEW"].includes(s.verificationState as string));
      const confidenceScore = verifiedSubs.length > 0
        ? Math.min(100, Math.round((Math.log10(verifiedSubs.length + 1) / Math.log10(60)) * 100 * 0.4 + (verifiedSubs.filter((s) => s.verificationState === "VERIFIED").length / verifiedSubs.length) * 100 * 0.6))
        : 0;
      const lastUpdated = verifiedSubs.length > 0
        ? new Date(Math.max(...verifiedSubs.map((s) => new Date(s.submittedAt as string).getTime())))
        : null;
      return {
        id: l.id as string,
        name: l.name as string,
        slug: l.slug as string,
        submissionCount: locSubs.length,
        confidenceScore,
        median2BHK: null,
        lastUpdated,
        scrapedCount: locSubs.filter((s) => (s.sourceType as string) === "LISTING_ESTIMATE").length,
      };
    });
  } catch {
    // DB unavailable
  }

  const content = <AdminDashboard submissions={submissions} localities={localities} />;
  return <AdminLogin>{content}</AdminLogin>;
}
