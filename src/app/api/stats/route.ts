import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

export async function GET() {
  const prisma = getPrisma();
  const city = await prisma.city.findFirst({ where: { slug: "hyderabad" } });
  if (!city) {
    return NextResponse.json({
      totalSubmissions: 0,
      localitiesWithData: 0,
      closedRentPercentage: 0,
      lastUpdated: new Date().toISOString(),
    });
  }

  const submissions = await prisma.rentSubmission.findMany({
    where: { locality: { cityId: city.id }, verificationState: { not: "REJECTED" } },
  });

  const localitiesWithData = new Set(submissions.map((s) => s.localityId)).size;
  const closed = submissions.filter((s) => s.rentType === "CLOSED").length;
  const lastUpdated = submissions.length > 0
    ? new Date(Math.max(...submissions.map((s) => new Date(s.submittedAt).getTime())))
    : new Date();

  return NextResponse.json({
    totalSubmissions: submissions.length,
    localitiesWithData,
    closedRentPercentage: submissions.length > 0 ? Math.round((closed / submissions.length) * 100) : 0,
    lastUpdated: lastUpdated.toISOString(),
  });
}
