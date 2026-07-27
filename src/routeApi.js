/**
 * Parse a Google Maps URL and extract { lat, lon }, or return null.
 * Supports: full google.com/maps URLs with @lat,lng or ?q=lat,lng
 */
export function parseGoogleMapsUrl(text) {
  const s = (text ?? '').trim();
  if (!s.includes('google') && !s.includes('goo.gl') && !s.includes('maps.app')) return null;

  // Extract place name from /maps/place/Place+Name/ path
  const placeMatch = s.match(/\/maps\/place\/([^/@?&]+)/);
  const name = placeMatch
    ? decodeURIComponent(placeMatch[1].replace(/\+/g, ' ').replace(/_/g, ' '))
    : null;

  // @lat,lng (most common in place/search URLs)
  const atMatch = s.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lon: parseFloat(atMatch[2]), name };

  // ?q=lat,lng or &q=lat,lng
  const qMatch = s.match(/[?&]q=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lon: parseFloat(qMatch[2]), name };

  // ll=lat,lng (older format)
  const llMatch = s.match(/ll=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (llMatch) return { lat: parseFloat(llMatch[1]), lon: parseFloat(llMatch[2]), name };

  return null; // shortened URL (goo.gl) — can't extract client-side
}

// Photon geocoding (komoot.io)
const PHOTON_API = 'https://photon.komoot.io/api/'

// OSRM routing servers
const OSRM_ROUTE = {
  car: 'https://router.project-osrm.org/route/v1/driving',
  walking: 'https://routing.openstreetmap.de/routed-foot/route/v1/foot',
  bicycle: 'https://routing.openstreetmap.de/routed-bike/route/v1/bike',
}

// OSRM Table API (driving only)
const OSRM_TABLE = 'https://router.project-osrm.org/table/v1/driving'

/**
 * Reverse geocode coordinates using Photon.
 * Returns a display name string, or null on failure.
 */
export async function photonReverse(lat, lon) {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  const res = await fetch(`${PHOTON_API}reverse?${params}`);
  if (!res.ok) return null;
  const data = await res.json();
  const f = data.features?.[0];
  if (!f) return null;
  const p = f.properties;
  return [p.name, p.city, p.country].filter(Boolean).join(', ');
}

/**
 * Search for a place using Photon geocoding.
 * Returns array of { displayName, lat, lon }
 */
export async function photonSearch(query, limit = 6) {
  const params = new URLSearchParams({ q: query, limit: String(limit) })
  const res = await fetch(`${PHOTON_API}?${params}`)
  if (!res.ok) throw new Error('Photon search failed')
  const data = await res.json()
  return data.features.map((f) => {
    const p = f.properties
    const [lon, lat] = f.geometry.coordinates
    return {
      displayName: [p.name, p.city, p.country].filter(Boolean).join(', '),
      lat,
      lon,
    }
  })
}

/**
 * Get driving route between two points.
 * Returns { distance_km, duration_min }
 */
export async function getRoute(oLat, oLon, dLat, dLon, mode = 'car') {
  const server = OSRM_ROUTE[mode] ?? OSRM_ROUTE.car
  const url = `${server}/${oLon},${oLat};${dLon},${dLat}?overview=false`
  const res = await fetch(url)
  if (!res.ok) throw new Error('OSRM error')
  const data = await res.json()
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No route found')
  const r = data.routes[0]
  return {
    distance_km: Math.round(r.distance / 100) / 10,
    duration_min: Math.round(r.duration / 60),
  }
}

/**
 * Get distance/duration matrix for multiple points (driving).
 * coords: [{ lat, lon }, ...]
 * Returns { durations: number[][], distances: number[][] } in seconds/meters
 */
export async function getDistanceMatrix(coords) {
  if (coords.length < 2) throw new Error('Need at least 2 points')
  const coordStr = coords.map((c) => `${c.lon},${c.lat}`).join(';')
  const url = `${OSRM_TABLE}/${coordStr}?annotations=duration,distance`
  const res = await fetch(url)
  if (!res.ok) throw new Error('OSRM table error')
  const data = await res.json()
  if (data.code !== 'Ok') throw new Error('OSRM table failed')
  return { durations: data.durations, distances: data.distances }
}

/**
 * Nearest-neighbor TSP heuristic.
 * matrix: n×n cost matrix (e.g. durations in seconds)
 * start: index to start from (default 0)
 * Returns { order: number[], totalCost: number }
 */
export function nearestNeighborTSP(matrix, start = 0) {
  const n = matrix.length
  const visited = new Array(n).fill(false)
  const order = [start]
  visited[start] = true
  let totalCost = 0

  for (let step = 0; step < n - 1; step++) {
    const cur = order[order.length - 1]
    let best = -1, bestCost = Infinity
    for (let j = 0; j < n; j++) {
      if (!visited[j] && matrix[cur][j] < bestCost) {
        best = j
        bestCost = matrix[cur][j]
      }
    }
    if (best === -1) break
    order.push(best)
    visited[best] = true
    totalCost += bestCost
  }

  return { order, totalCost }
}

/**
 * Calculate total cost of a route order given a cost matrix.
 */
export function routeCost(matrix, order) {
  let total = 0
  for (let i = 0; i < order.length - 1; i++) {
    total += matrix[order[i]][order[i + 1]]
  }
  return total
}
