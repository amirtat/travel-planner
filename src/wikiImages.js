/**
 * Searches Wikipedia for photos related to a destination name.
 * Uses the open Wikipedia API — no key required.
 */
export async function searchWikiImages(rawQuery) {
  // Strip 4-digit years and trim
  const query = rawQuery.replace(/\d{4}/g, '').trim();
  if (!query) return [];

  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrlimit: '12',
    prop: 'pageimages',
    pithumbsize: '900',
    piprop: 'thumbnail',
    format: 'json',
    origin: '*',
  });

  try {
    const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    const pages = Object.values(data.query?.pages ?? {});
    return pages
      .filter((p) => p.thumbnail?.source)
      .map((p) => ({ url: p.thumbnail.source, title: p.title }));
  } catch {
    return [];
  }
}
