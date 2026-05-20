import { NextResponse } from "next/server";
import { getCityStats } from "@/lib/data/db";

export async function GET() {
  const stats = await getCityStats();
  return NextResponse.json({
    ...stats,
    lastUpdated: stats.lastUpdated.toISOString(),
  });
}
