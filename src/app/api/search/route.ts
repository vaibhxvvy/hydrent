import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/db";
import { levenshtein, normalizeSearch } from "@/lib/search";

function scoreQuery(query: string, candidates: string[]) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return 0;

  return Math.max(
    ...candidates.map((candidate) => {
      const normalizedCandidate = normalizeSearch(candidate);
      if (normalizedCandidate === normalizedQuery) return 100;
      if (normalizedCandidate.includes(normalizedQuery)) return 86;
      if (normalizedQuery.includes(normalizedCandidate)) return 78;
      const distance = levenshtein(normalizedQuery, normalizedCandidate);
      return Math.max(0, 70 - distance * 9);
    }),
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const supabase = getSupabaseServer();
  const { data: city } = await supabase
    .from("City")
    .select("id")
    .eq("slug", "hyderabad")
    .limit(1)
    .maybeSingle();

  const results: { type: string; title: string; subtitle: string; href: string; score: number }[] = [];

  if (city) {
    const { data: zones } = await supabase
      .from("Zone")
      .select("id, name")
      .throwOnError();
    const zoneMap = new Map((zones || []).map((z: { id: string; name: string }) => [z.id, z.name]));

    const { data: localities } = await supabase
      .from("Locality")
      .select("*")
      .eq("cityId", city.id)
      .throwOnError();

    for (const locality of (localities || []) as Array<Record<string, unknown>>) {
      const candidates = [
        locality.name as string,
        locality.slug as string,
        ...((locality.aliases as string[]) || []),
      ];
      const score = scoreQuery(query, candidates);
      if (score >= 42) {
        results.push({
          type: "locality",
          title: locality.name as string,
          subtitle: (locality.zoneId ? (zoneMap.get(locality.zoneId as string) || "Hyderabad") : "Hyderabad") as string,
          href: `/hyderabad/${locality.slug}`,
          score,
        });
      }
    }

    const { data: buildings } = await supabase
      .from("Building")
      .select("*, locality:Locality(name)")
      .throwOnError();

    for (const building of (buildings || []) as Array<Record<string, unknown>>) {
      const candidates = [building.name as string, building.slug as string];
      const score = scoreQuery(query, candidates);
      if (score >= 42) {
        const loc = building.locality as { name: string } | null;
        results.push({
          type: "building",
          title: building.name as string,
          subtitle: loc?.name || "Hyderabad",
          href: `/building/${building.slug}`,
          score,
        });
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  return NextResponse.json({ results: results.slice(0, 8) });
}
