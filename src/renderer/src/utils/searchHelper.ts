/**
 * Smart Token / Fuzzy Search Helper
 * Supports multi-token spaced search (e.g., "Conan 1876" matches "Thám Tử Lừng Danh Conan - Tập 1876")
 * Supports Vietnamese diacritics-insensitive matching ("hanh dong" matches "hành động")
 * Supports genre/tag search and multi-field aggregation
 */

export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export function matchSmartSearch(
  sources: (string | string[] | undefined | null)[],
  query: string
): boolean {
  if (!query || !query.trim()) return true;

  const rawQuery = query.trim().toLowerCase();
  const normalizedQuery = removeVietnameseTones(rawQuery);
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) return true;

  // Flatten sources into a single normalized searchable string
  const flatStrings: string[] = [];
  for (const src of sources) {
    if (!src) continue;
    if (Array.isArray(src)) {
      flatStrings.push(...src.filter(Boolean));
    } else if (typeof src === 'string') {
      flatStrings.push(src);
    }
  }

  const combinedRaw = flatStrings.join(' ').toLowerCase();
  const combinedNormalized = removeVietnameseTones(combinedRaw);

  // Every token in query must be present in either raw or normalized string
  return tokens.every(
    (token) => combinedNormalized.includes(token) || combinedRaw.includes(token)
  );
}
