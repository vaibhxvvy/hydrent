export function normalizeSearch(input: string) {
  return input
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

export function routeForBhk(localitySlug: string, bhk: string) {
  return `/hyderabad/${localitySlug}/${bhk.toLowerCase()}`;
}
