import { getPrisma } from "@/lib/db";

export async function GET() {
  try {
    const prisma = getPrisma();
    const submissions = await prisma.rentSubmission.findMany({
      where: { verificationState: { not: "REJECTED" } },
      include: { locality: true },
      orderBy: { submittedAt: "desc" },
      take: 5,
    });

    const now = new Date();
    const data = submissions.map((s) => {
      const diffMs = now.getTime() - new Date(s.submittedAt).getTime();
      const diffMin = Math.floor(diffMs / 60000);
      let timeAgo = "just now";
      if (diffMin >= 1 && diffMin < 60) timeAgo = `${diffMin}m ago`;
      else if (diffMin >= 60) {
        const diffHr = Math.floor(diffMin / 60);
        timeAgo = diffHr < 24 ? `${diffHr}h ago` : `${Math.floor(diffHr / 24)}d ago`;
      }
      return {
        bhk: s.bhk,
        locality: s.locality.name,
        rent: s.effectiveMonthlyCost,
        trustScore: Math.round(Number(s.trustScore)),
        timeAgo,
      };
    });

    return Response.json(data);
  } catch {
    return Response.json([]);
  }
}
