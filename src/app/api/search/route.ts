import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
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

  const prisma = getPrisma();
  const city = await prisma.city.findFirst({ where: { slug: "hyderabad" } });

  const results: { type: string; title: string; subtitle: string; href: string; score: number }[] = [];

  if (city) {
    const localities = await prisma.locality.findMany({
      where: { cityId: city.id },
      include: { zone: true },
    });

    for (const locality of localities) {
      const candidates = [
        locality.name,
        locality.slug,
        ...((locality.aliases as string[]) || []),
      ];
      const score = scoreQuery(query, candidates);
      if (score >= 42) {
        results.push({
          type: "locality",
          title: locality.name,
          subtitle: `${locality.zone?.name || "Hyderabad"}`,
          href: `/hyderabad/${locality.slug}`,
          score,
        });
      }
    }

    const buildings = await prisma.building.findMany({
      include: { locality: true },
    });

    for (const building of buildings) {
      const candidates = [building.name, building.slug];
      const score = scoreQuery(query, candidates);
      if (score >= 42) {
        results.push({
          type: "building",
          title: building.name,
          subtitle: building.locality?.name || "Hyderabad",
          href: `/building/${building.slug}`,
          score,
        });
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  return NextResponse.json({ results: results.slice(0, 8) });
}
