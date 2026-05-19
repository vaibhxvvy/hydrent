import { NextResponse } from "next/server";
import { searchHydRent } from "@/lib/search";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  return NextResponse.json({ results: searchHydRent(query) });
}
