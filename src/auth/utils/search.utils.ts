/**
 * Remove Vietnamese diacritics and normalize string for search
 * Ví dụ: "Nguyễn Văn A" → "Nguyen Van A"
 */
export function removeDiacritics(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .trim();
}

/**
 * Create fuzzy search pattern for PostgreSQL
 * Ví dụ: "john doe" → "john%doe%" (matches "john ... doe" anywhere)
 */
export function createFuzzySearchPattern(text: string): string {
  return text
    .split(/\s+/)
    .filter(word => word.length > 0)
    .join('%');
}

/**
 * Normalize search text: remove diacritics, lowercase, trim
 * Ví dụ: "Nguyễn Văn A" → "nguyen van a"
 */
export function normalizeSearchText(text: string): string {
  return removeDiacritics(text);
}
