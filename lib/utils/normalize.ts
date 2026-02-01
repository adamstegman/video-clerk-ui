/**
 * Normalizes Supabase relation data which can return single object or array.
 * This is needed because Supabase joins can return either a single object
 * or an array depending on the relationship type.
 */

export function normalizeDetails<T>(details: T | T[] | null): T | null {
  if (!details) return null;
  return Array.isArray(details) ? details[0] ?? null : details;
}

export function normalizeTagName(
  tags:
    | { name: string | null }
    | Array<{ name: string | null }>
    | null
): string | null {
  if (!tags) return null;
  return Array.isArray(tags) ? tags[0]?.name ?? null : tags.name ?? null;
}

export function getReleaseYear(releaseDate: string | null | undefined): string {
  if (!releaseDate) return '';
  const year = releaseDate.split('-')[0];
  return year || '';
}

/**
 * Normalizes a tag key for comparison (lowercase, trimmed)
 */
export function normalizeTagKey(name: string): string {
  return name.toLowerCase().trim();
}
