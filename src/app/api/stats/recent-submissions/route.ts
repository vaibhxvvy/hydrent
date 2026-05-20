import { getSupabaseServer } from "@/lib/db";

export async function GET() {
  try {
    const supabase = getSupabaseServer();
    const { data: submissions, error } = await supabase
      .from("RentSubmission")
      .select("bhk, effectiveMonthlyCost, trustScore, submittedAt, locality:Locality(name)")
      .neq("verificationState", "REJECTED")
      .order("submittedAt", { ascending: false })
      .limit(5);

    if (error || !submissions) {
      return Response.json([]);
    }

    const now = new Date();
    const data = submissions.map((s: Record<string, unknown>) => {
      const locality = s.locality as { name: string } | null;
      const submittedAt = new Date(s.submittedAt as string);
      const diffMs = now.getTime() - submittedAt.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      let timeAgo = "just now";
      if (diffMin >= 1 && diffMin < 60) timeAgo = `${diffMin}m ago`;
      else if (diffMin >= 60) {
        const diffHr = Math.floor(diffMin / 60);
        timeAgo = diffHr < 24 ? `${diffHr}h ago` : `${Math.floor(diffHr / 24)}d ago`;
      }
      return {
        bhk: s.bhk,
        locality: locality?.name || "Unknown",
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
