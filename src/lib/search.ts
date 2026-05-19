import { buildings, localities } from "@/lib/data/hyderabad";
import { slugify } from "@/lib/utils";

const transliterationHints: Record<string, string> = {
  గచ్చిబౌలి: "gachibowli",
  కొండాపూర్: "kondapur",
  మాదాపూర్: "madhapur",
  మణికొండ: "manikonda",
};

export function normalizeSearch(input: string) {
  const hinted = transliterationHints[input.trim()] ?? input;
  return hinted
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

export function levenshtein(a: string, b: string) {
  const matrix = Array.from({ length: b.length + 1 }, (_, row) => [row]);

  for (let column = 0; column <= a.length; column += 1) {
    matrix[0]![column] = column;
  }

  for (let row = 1; row <= b.length; row += 1) {
    for (let column = 1; column <= a.length; column += 1) {
      matrix[row]![column] =
        b.charAt(row - 1) === a.charAt(column - 1)
          ? matrix[row - 1]![column - 1]!
          : Math.min(
              matrix[row - 1]![column - 1]! + 1,
              matrix[row]![column - 1]! + 1,
              matrix[row - 1]![column]! + 1,
            );
    }
  }

  return matrix[b.length]![a.length]!;
}

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

export function searchHydRent(query: string) {
  const localityResults = localities.map((locality) => ({
    type: "locality" as const,
    title: locality.name,
    subtitle: `${locality.zone} · ${locality.commuteAnchors.slice(0, 2).join(", ")}`,
    href: `/hyderabad/${locality.slug}`,
    score: scoreQuery(query, [locality.name, locality.slug, ...locality.aliases]),
  }));

  const buildingResults = buildings.map((building) => {
    const locality = localities.find((item) => item.slug === building.localitySlug);
    return {
      type: "building" as const,
      title: building.name,
      subtitle: `${building.microLocality} · ${locality?.name ?? "Hyderabad"}`,
      href: `/building/${building.slug}`,
      score: scoreQuery(query, [building.name, building.slug, ...building.aliases]),
    };
  });

  return [...localityResults, ...buildingResults]
    .filter((result) => result.score >= 42)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

export function routeForBhk(localitySlug: string, bhk: string) {
  return `/hyderabad/${slugify(localitySlug)}/${bhk.toLowerCase()}`;
}
