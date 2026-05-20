import { getPrisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { submissionId, action } = await request.json();
    const prisma = getPrisma();

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

    const updateData: Record<string, any> = { verificationState };
    if (action === "APPROVE") {
      updateData.publishedAt = new Date();
    }
    await prisma.rentSubmission.update({
      where: { id: submissionId },
      data: updateData,
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Failed to moderate" }, { status: 500 });
  }
}
