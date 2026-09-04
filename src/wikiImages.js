/**
 * Searches Wikimedia Commons for photos related to a destination.
 * No API key required.
 */
export async function searchWikiImages(rawQuery) {
  const query = rawQuery.replace(/\d{4}/g, '').trim();
  if (!query) return [];

  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',   // File: namespace only — actual image files
    gsrlimit: '30',
    prop: 'imageinfo',
    iiprop: 'url|mime',
    iiurlwidth: '900',
    format: 'json',
    origin: '*',
  });

  try {
    const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    const pages = Object.values(data.query?.pages ?? {});
    return pages
      .filter((p) => {
        const info = p.imageinfo?.[0];
        if (!info) return false;
        const mime = info.mime ?? '';
        // Only jpeg/png photos — skip SVG, OGG, PDF, etc.
        return mime.startsWith('image/jpeg') || mime.startsWith('image/png') || mime.startsWith('image/webp');
      })
      .map((p) => {
        const info = p.imageinfo[0];
        return {
          url: info.thumburl ?? info.url,
          title: p.title.replace(/^File:/, '').replace(/\.[^.]+$/, ''),
        };
      });
  } catch {
    return [];
  }
}
