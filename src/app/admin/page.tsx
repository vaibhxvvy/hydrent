import type { Metadata } from "next";
import AdminLogin from "@/components/admin/admin-auth";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getAllSubmissions } from "@/lib/data/db";
import { getPrisma } from "@/lib/db";
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
    const prisma = getPrisma();
    const dbLocalities = await prisma.locality.findMany({
      include: {
        rentSubmissions: { select: { id: true, trustScore: true, verificationState: true, submittedAt: true, sourceType: true } },
        zone: true,
      },
      orderBy: { name: "asc" },
    });

    localities = dbLocalities.map((l) => {
      const locSubs = l.rentSubmissions;
      const verifiedSubs = locSubs.filter((s) => ["VERIFIED", "COMMUNITY_REVIEW"].includes(s.verificationState));
      const bhk2 = locSubs.filter((s) => !s.id); // Simplified - we don't have bhk here
      const confidenceScore = verifiedSubs.length > 0
        ? Math.min(100, Math.round((Math.log10(verifiedSubs.length + 1) / Math.log10(60)) * 100 * 0.4 + (verifiedSubs.filter((s) => s.verificationState === "VERIFIED").length / verifiedSubs.length) * 100 * 0.6))
        : 0;
      const lastUpdated = verifiedSubs.length > 0
        ? new Date(Math.max(...verifiedSubs.map((s) => new Date(s.submittedAt).getTime())))
        : null;
      return {
        id: l.id,
        name: l.name,
        slug: l.slug,
        submissionCount: locSubs.length,
        confidenceScore,
        median2BHK: null,
        lastUpdated,
        scrapedCount: locSubs.filter((s) => s.sourceType === "LISTING_ESTIMATE").length,
      };
    });
  } catch {
    // DB unavailable
  }

  const content = <AdminDashboard submissions={submissions} localities={localities} />;
  return <AdminLogin>{content}</AdminLogin>;
}
