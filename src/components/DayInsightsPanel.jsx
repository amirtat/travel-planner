import { useState } from 'react';
import { Car, RotateCw, AlertCircle, Check, ArrowRight, MapPin, Sparkles, Hotel } from 'lucide-react';
import { getDistanceMatrix, routeCost } from '../routeApi';

function formatTime(seconds) {
  if (seconds == null) return '—';
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min} דק'`;
  const h = Math.floor(min / 60), m = min % 60;
  return m > 0 ? `${h}ש' ${m}דק'` : `${h}ש'`;
}

function formatDist(meters) {
  if (meters == null) return '—';
  return `${Math.round(meters / 100) / 10} ק"מ`;
}

// ── Optimization algorithms ────────────────────────────────────────────────

// Cost of a middle-stop order given fixed prev/next endpoints
function pathCost(matrix, order, prevIdx, nextIdx) {
  if (order.length === 0) return 0;
  let cost = 0;
  if (prevIdx !== null) cost += matrix[prevIdx][order[0]];
  for (let i = 0; i < order.length - 1; i++) cost += matrix[order[i]][order[i + 1]];
  if (nextIdx !== null) cost += matrix[order[order.length - 1]][nextIdx];
  return cost;
}

// Generate all permutations of an array
function* permutations(arr) {
  if (arr.length <= 1) { yield arr; return; }
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) yield [arr[i], ...perm];
  }
}

// Nearest-neighbor from a departure point (prevIdx may be null → start freely)
function nearestNeighbor(matrix, indices, prevIdx) {
  if (indices.length === 0) return [];
  const remaining = new Set(indices);
  const order = [];
  let current = prevIdx;

  if (current === null) {
    current = indices[0];
    remaining.delete(current);
    order.push(current);
  }

  while (remaining.size > 0) {
    let best = -1, bestCost = Infinity;
    for (const j of remaining) {
      if (matrix[current][j] < bestCost) { best = j; bestCost = matrix[current][j]; }
    }
    if (best === -1) break;
    order.push(best);
    remaining.delete(best);
    current = best;
  }
  return order;
}

// 2-opt local search on middle indices with fixed endpoints
function twoOpt(matrix, order, prevIdx, nextIdx) {
  if (order.length <= 2) return order;
  let best = order;
  let bestCost = pathCost(matrix, order, prevIdx, nextIdx);
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let k = i + 1; k < best.length; k++) {
        const candidate = [
          ...best.slice(0, i),
          ...best.slice(i, k + 1).reverse(),
          ...best.slice(k + 1),
        ];
        const cost = pathCost(matrix, candidate, prevIdx, nextIdx);
        if (cost < bestCost) {
          best = candidate;
          bestCost = cost;
          improved = true;
        }
      }
    }
  }
  return best;
}

// Main optimizer: exact for ≤8 stops, nearest-neighbor+2-opt for more
function optimizeMiddle(matrix, middleIndices, prevIdx, nextIdx) {
  if (middleIndices.length === 0) return [];
  if (middleIndices.length === 1) return middleIndices;

  if (middleIndices.length <= 8) {
    // Exact: try every permutation
    let bestOrder = middleIndices;
    let bestCost = pathCost(matrix, middleIndices, prevIdx, nextIdx);
    for (const perm of permutations(middleIndices)) {
      const cost = pathCost(matrix, perm, prevIdx, nextIdx);
      if (cost < bestCost) { bestCost = cost; bestOrder = [...perm]; }
    }
    return bestOrder;
  }

  // For larger n: nearest-neighbor from each possible start + 2-opt, keep best
  let bestOrder = null;
  let bestCost = Infinity;
  const startCandidates = prevIdx !== null ? [prevIdx] : middleIndices;
  for (const startFrom of startCandidates) {
    const nn = nearestNeighbor(matrix, middleIndices, startFrom === prevIdx ? prevIdx : null);
    const opt = twoOpt(matrix, nn, prevIdx, nextIdx);
    const cost = pathCost(matrix, opt, prevIdx, nextIdx);
    if (cost < bestCost) { bestCost = cost; bestOrder = opt; }
  }
  return bestOrder ?? middleIndices;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function DayInsightsPanel({ day, places, store, prevPlace }) {
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const currentHotel = day.accommodationId
    ? places.find((p) => p.id === day.accommodationId)
    : null;

  const stopIds = (day.items ?? [])
    .filter((i) => i.type === 'place')
    .map((i) => i.id);

  const middlePlaces = stopIds
    .map((id) => places.find((p) => p.id === id))
    .filter(Boolean);

  const startPlace = prevPlace ?? null;

  const startNode  = startPlace  ? { ...startPlace,  role: 'start' } : null;
  const endNode    = currentHotel ? { ...currentHotel, role: 'end'  } : null;
  const middleNodes = middlePlaces.map((p) => ({ ...p, role: 'stop' }));

  const allNodes = [
    ...(startNode ? [startNode] : []),
    ...middleNodes,
    ...(endNode ? [endNode] : []),
  ];

  const geocodedNodes = allNodes.filter((n) => n.lat != null && n.lon != null);
  const missingCoords = allNodes.length - geocodedNodes.length;
  const canCalculate = geocodedNodes.length >= 2;

  if (allNodes.length < 2) {
    if (!startNode && !endNode) {
      return (
        <div className="px-4 py-2 text-xs italic" style={{ color: 'var(--c-muted)', background: 'var(--c-vellum)', borderTop: '1px solid var(--c-border)' }}>
          הוסף לינה ועצירות ביום זה כדי לחשב מסלול
        </div>
      );
    }
    if (middleNodes.length === 0 && (!startNode || !endNode)) {
      return (
        <div className="px-4 py-2 text-xs italic" style={{ color: 'var(--c-muted)', background: 'var(--c-vellum)', borderTop: '1px solid var(--c-border)' }}>
          הוסף עצירות ביום זה כדי לחשב מסלול
        </div>
      );
    }
  }

  const calculate = async () => {
    if (!canCalculate) { setStatus('no-coords'); return; }
    setStatus('loading');
    setErrorMsg('');
    try {
      const coords = geocodedNodes.map((n) => ({ lat: n.lat, lon: n.lon }));
      const { durations, distances } = await getDistanceMatrix(coords);
      const n = geocodedNodes.length;

      const hasStart = startNode && geocodedNodes[0].role === 'start';
      const hasEnd   = endNode   && geocodedNodes[n - 1].role === 'end';
      const startIdx = hasStart ? 0 : null;
      const endIdx   = hasEnd   ? n - 1 : null;

      const middleIndices = geocodedNodes
        .map((_, i) => i)
        .filter((i) => i !== startIdx && i !== endIdx);

      // Current order (as given by user)
      const currentOrder = [
        ...(hasStart ? [startIdx] : []),
        ...middleIndices,
        ...(hasEnd   ? [endIdx]  : []),
      ];
      const currentDuration = routeCost(durations, currentOrder);
      const currentDistance = routeCost(distances, currentOrder);

      // Optimized order
      const optMiddleOrder = optimizeMiddle(durations, middleIndices, startIdx, endIdx);
      const optOrder = [
        ...(hasStart ? [startIdx] : []),
        ...optMiddleOrder,
        ...(hasEnd   ? [endIdx]  : []),
      ];
      const optDuration = routeCost(durations, optOrder);
      const optDistance = routeCost(distances, optOrder);

      const savedSec = currentDuration - optDuration;
      const isOptimal = savedSec < 60;

      const legs = optOrder.slice(0, -1).map((fi, i) => {
        const ti = optOrder[i + 1];
        return {
          from: geocodedNodes[fi].name,
          to:   geocodedNodes[ti].name,
          duration: durations[fi][ti],
          distance: distances[fi][ti],
        };
      });

      const optimalStopIds = optMiddleOrder.map((i) => geocodedNodes[i].id);
      const ungeocodedStopIds = stopIds.filter(
        (id) => !geocodedNodes.some((nd) => nd.id === id)
      );

      const isExact = middleIndices.length <= 8;

      setResult({
        totalDuration: optDuration,
        totalDistance: optDistance,
        savedSec,
        isOptimal,
        isExact,
        orderedNodes: optOrder.map((i) => geocodedNodes[i]),
        legs,
        missingCoords,
        optimalStopIds: [...optimalStopIds, ...ungeocodedStopIds],
      });
      setStatus('done');
    } catch (e) {
      setErrorMsg(e.message || 'שגיאה בחישוב מרחקים');
      setStatus('error');
    }
  };

  const nodeBadge = (role) => {
    if (role === 'start') return { background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac' };
    if (role === 'end')   return { background: 'var(--c-amber-light)', color: 'var(--c-amber)', border: '1px solid var(--c-amber-mid)' };
    return { background: 'var(--c-vellum)', color: 'var(--c-ink)', border: '1px solid var(--c-border)' };
  };

  const nodeLabel = (role, name) => {
    const short = name.length > 20 ? name.slice(0, 20) + '…' : name;
    if (role === 'start') return `⬤ ${short}`;
    if (role === 'end')   return `${short} ⬤`;
    return short;
  };

  return (
    <div className="px-4 py-2.5" style={{ borderTop: '1px solid var(--c-border)', background: 'var(--c-vellum)' }}>

      {/* No previous hotel warning */}
      {!startNode && (
        <div className="flex items-center gap-1.5 text-xs mb-2" style={{ color: 'var(--c-amber)' }}>
          <AlertCircle size={11} />
          {day.stops?.length
            ? 'לא הוגדר מלון לאמש — מוצא המסלול לא ידוע'
            : 'הגדר מלון לאמש ועצירות להיום כדי לחשב מסלול'}
        </div>
      )}

      {startNode && startNode.lat == null && (
        <div className="flex items-center gap-1.5 text-xs mb-2" style={{ color: 'var(--c-amber)' }}>
          <AlertCircle size={11} />
          למלון אמש ({startNode.name}) חסר מיקום — פתח אותו במקומות והוסף כתובת לאימות
        </div>
      )}

      {status === 'idle' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: 'var(--c-muted)' }}>
            {startNode && (
              <span className="flex items-center gap-1" style={{ color: '#15803d' }}>
                <Hotel size={11} />
                מ: {startNode.name.length > 18 ? startNode.name.slice(0, 18) + '…' : startNode.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin size={11} style={{ color: 'var(--c-amber)' }} />
              {middleNodes.length} עצירות
            </span>
            {endNode && (
              <span className="flex items-center gap-1" style={{ color: 'var(--c-amber)' }}>
                <Hotel size={11} />
                אל: {endNode.name.length > 18 ? endNode.name.slice(0, 18) + '…' : endNode.name}
              </span>
            )}
            {missingCoords > 0 && (
              <span className="flex items-center gap-1" style={{ color: 'var(--c-amber)' }}>
                <AlertCircle size={11} />
                {missingCoords} ללא מיקום
              </span>
            )}
          </div>
          <button
            onClick={calculate}
            disabled={!canCalculate}
            className="flex items-center gap-1 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ color: 'var(--c-amber)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--c-ink)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--c-amber)'}
          >
            <RotateCw size={11} />
            חשב מסלול מיטבי
          </button>
        </div>
      )}

      {status === 'loading' && (
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--c-muted)' }}>
          <RotateCw size={12} className="animate-spin" style={{ color: 'var(--c-amber)' }} />
          מחשב מרחקים...
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <AlertCircle size={12} />
          {errorMsg}
          <button onClick={calculate} className="underline ms-1">נסה שוב</button>
        </div>
      )}

      {status === 'no-coords' && (
        <div className="text-xs flex items-center gap-1.5" style={{ color: 'var(--c-amber)' }}>
          <AlertCircle size={12} />
          חסרות קואורדינטות — פתח מקומות והוסף כתובות לאימות מיקום
        </div>
      )}

      {status === 'done' && result && (
        <div className="space-y-2">
          {/* Summary */}
          <div className="flex items-center gap-3 flex-wrap text-xs">
            <div className="flex items-center gap-2 font-medium" style={{ color: 'var(--c-ink)' }}>
              <span className="flex items-center gap-1">
                <Car size={12} style={{ color: 'var(--c-amber)' }} />
                {formatDist(result.totalDistance)}
              </span>
              <span style={{ color: 'var(--c-border)' }}>·</span>
              <span>{formatTime(result.totalDuration)} נסיעה</span>
            </div>

            {result.isOptimal ? (
              <span className="flex items-center gap-1" style={{ color: '#15803d' }}>
                <Check size={11} />
                {result.isExact ? 'מסלול מדויק ✓' : 'מסלול מיטבי ✓'}
              </span>
            ) : (
              <span style={{ color: 'var(--c-amber)' }}>
                ניתן לחסוך {formatTime(result.savedSec)} בסדר מיטבי
              </span>
            )}

            {!result.isOptimal && store && (
              <button
                onClick={() => {
                  const textItems = (day.items ?? []).filter((i) => i.type === 'text');
                  const newItems = [
                    ...result.optimalStopIds.map((id) => ({ type: 'place', id })),
                    ...textItems,
                  ];
                  store.updateDay(day.id, { items: newItems });
                  setStatus('idle');
                  setResult(null);
                }}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-opacity hover:opacity-80"
                style={{ background: 'var(--c-ink)', color: 'var(--c-vellum)' }}
              >
                <Sparkles size={10} />
                החל סדר מיטבי
              </button>
            )}

            {result.missingCoords > 0 && (
              <span style={{ color: 'var(--c-muted)' }}>
                ({result.missingCoords} לא נכללו — חסר מיקום)
              </span>
            )}

            <button
              onClick={() => setStatus('idle')}
              className="ms-auto transition-colors"
              style={{ color: 'var(--c-border)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--c-muted)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--c-border)'}
            >✕</button>
          </div>

          {/* Route visualization — always LTR so arrows point correctly */}
          <div className="flex flex-wrap items-center gap-1 text-xs" dir="ltr">
            {result.orderedNodes.map((node, i) => (
              <span key={`${node.id}-${i}`} className="flex items-center gap-1">
                <span
                  className="px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                  style={nodeBadge(node.role)}
                >
                  {nodeLabel(node.role, node.name)}
                </span>
                {i < result.orderedNodes.length - 1 && (
                  <span className="flex items-center gap-0.5" style={{ color: 'var(--c-muted)' }}>
                    <ArrowRight size={10} />
                    <span>{formatTime(result.legs[i].duration)}</span>
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
