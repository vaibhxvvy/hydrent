import { getSupabaseServer } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { submissionId, action } = await request.json();
    const supabase = getSupabaseServer();

    let verificationState: string;
    switch (action) {
      case "APPROVE":
        verificationState = "VERIFIED";
        break;
      case "FLAG":
        verificationState = "DISPUTED";
        break;
      case "REJECT":
        verificationState = "REJECTED";
        break;
      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { verificationState };
    if (action === "APPROVE") {
      updateData.publishedAt = new Date().toISOString();
    }

    const { error } = await supabase
      .from("RentSubmission")
      .update(updateData)
      .eq("id", submissionId);

    if (error) throw error;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Failed to moderate" }, { status: 500 });
  }
}
