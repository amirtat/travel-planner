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

// Nearest-neighbor TSP on a subset of indices, starting from startIdx
// Returns ordered list of those indices
function nearestNeighborSubset(matrix, indices, startIdx) {
  const remaining = new Set(indices.filter((i) => i !== startIdx));
  const order = [startIdx];
  let current = startIdx;
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

export default function DayInsightsPanel({ day, places, store, prevPlace }) {
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // --- Build the 3-part route: start → middle stops → end ---
  const currentHotel = day.accommodationId
    ? places.find((p) => p.id === day.accommodationId)
    : null;

  const stopIds = (day.items ?? [])
    .filter((i) => i.type === 'place')
    .map((i) => i.id);

  const middlePlaces = stopIds
    .map((id) => places.find((p) => p.id === id))
    .filter(Boolean);

  // startPlace: previous day's hotel (preferred) or null
  const startPlace = prevPlace ?? null;

  // Roles for display
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

  // Need at least 2 points to calculate
  const canCalculate = geocodedNodes.length >= 2;

  // --- Insufficient data messages ---
  if (allNodes.length < 2) {
    if (!startNode && !endNode) {
      return (
        <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-t border-gray-100 italic">
          הוסף לינה ועצירות ביום זה כדי לחשב מסלול
        </div>
      );
    }
    if (middleNodes.length === 0 && (!startNode || !endNode)) {
      return (
        <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-t border-gray-100 italic">
          הוסף עצירות ביום זה כדי לחשב מסלול
        </div>
      );
    }
  }

  // --- Calculate ---
  const calculate = async () => {
    if (!canCalculate) { setStatus('no-coords'); return; }
    setStatus('loading');
    setErrorMsg('');
    try {
      const coords = geocodedNodes.map((n) => ({ lat: n.lat, lon: n.lon }));
      const { durations, distances } = await getDistanceMatrix(coords);
      const n = geocodedNodes.length;

      // Identify indices: start=0 (if startNode geocoded), end=last (if endNode geocoded)
      let startIdx = null, endIdx = null;
      const hasStart = startNode && geocodedNodes[0].role === 'start';
      const hasEnd   = endNode   && geocodedNodes[n - 1].role === 'end';

      if (hasStart) startIdx = 0;
      if (hasEnd)   endIdx   = n - 1;

      // Middle indices = everything except fixed start and end
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

      // Optimal: TSP on middle indices, starting from startIdx or first middle
      let optMiddleOrder;
      if (middleIndices.length === 0) {
        optMiddleOrder = [];
      } else {
        const tspStart = hasStart ? startIdx : middleIndices[0];
        const tspIndices = hasStart ? middleIndices : middleIndices;
        // Run nearest-neighbor through middle indices from the departure point
        const prevNode = hasStart ? startIdx : null;
        optMiddleOrder = optimizeMiddle(durations, middleIndices, prevNode);
      }

      const optOrder = [
        ...(hasStart ? [startIdx] : []),
        ...optMiddleOrder,
        ...(hasEnd   ? [endIdx]  : []),
      ];
      const optDuration = routeCost(durations, optOrder);
      const optDistance = routeCost(distances, optOrder);

      const savedSec = currentDuration - optDuration;
      const isOptimal = savedSec < 60;

      // Build legs
      const legs = optOrder.slice(0, -1).map((fi, i) => {
        const ti = optOrder[i + 1];
        return {
          from: geocodedNodes[fi].name,
          to:   geocodedNodes[ti].name,
          duration: durations[fi][ti],
          distance: distances[fi][ti],
        };
      });

      // Compute optimal stop IDs for "Apply" button (middle only)
      const optimalStopIds = optMiddleOrder.map((i) => geocodedNodes[i].id);
      const ungeocodedStopIds = stopIds.filter(
        (id) => !geocodedNodes.some((n) => n.id === id)
      );

      setResult({
        totalDuration: optDuration,
        totalDistance: optDistance,
        savedSec,
        isOptimal,
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

  // Route visualization badge style per role
  const nodeBadge = (role) => {
    if (role === 'start') return 'bg-green-100 text-green-700 border border-green-200';
    if (role === 'end')   return 'bg-blue-100 text-blue-700 border border-blue-200';
    return 'bg-gray-100 text-gray-700';
  };

  const nodeLabel = (role, name) => {
    const short = name.length > 20 ? name.slice(0, 20) + '…' : name;
    if (role === 'start') return `⬤ ${short}`;
    if (role === 'end')   return `${short} ⬤`;
    return short;
  };

  return (
    <div className="border-t border-indigo-100 bg-indigo-50/30 px-4 py-2.5">

      {/* No previous hotel warning */}
      {!startNode && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-2">
          <AlertCircle size={11} />
          {day.stops?.length
            ? 'לא הוגדר מלון לאמש — מוצא המסלול לא ידוע'
            : 'הגדר מלון לאמש ועצירות להיום כדי לחשב מסלול'}
        </div>
      )}

      {/* Previous hotel exists but has no coords */}
      {startNode && startNode.lat == null && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-2">
          <AlertCircle size={11} />
          למלון אמש ({startNode.name}) חסר מיקום — פתח אותו במקומות והוסף כתובת לאימות
        </div>
      )}

      {status === 'idle' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {startNode && (
              <span className="flex items-center gap-1 text-green-600">
                <Hotel size={11} />
                מ: {startNode.name.length > 18 ? startNode.name.slice(0, 18) + '…' : startNode.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin size={11} className="text-indigo-400" />
              {middleNodes.length} עצירות
            </span>
            {endNode && (
              <span className="flex items-center gap-1 text-blue-600">
                <Hotel size={11} />
                אל: {endNode.name.length > 18 ? endNode.name.slice(0, 18) + '…' : endNode.name}
              </span>
            )}
            {missingCoords > 0 && (
              <span className="text-amber-600 flex items-center gap-1">
                <AlertCircle size={11} />
                {missingCoords} ללא מיקום
              </span>
            )}
          </div>
          <button
            onClick={calculate}
            disabled={!canCalculate}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCw size={11} />
            חשב מסלול מיטבי
          </button>
        </div>
      )}

      {status === 'loading' && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <RotateCw size={12} className="animate-spin text-indigo-400" />
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
        <div className="text-xs text-amber-600 flex items-center gap-1.5">
          <AlertCircle size={12} />
          חסרות קואורדינטות — פתח מקומות והוסף כתובות לאימות מיקום
        </div>
      )}

      {status === 'done' && result && (
        <div className="space-y-2">
          {/* Summary */}
          <div className="flex items-center gap-3 flex-wrap text-xs">
            <div className="flex items-center gap-2 font-medium text-gray-700">
              <span className="flex items-center gap-1">
                <Car size={12} className="text-indigo-500" />
                {formatDist(result.totalDistance)}
              </span>
              <span className="text-gray-400">·</span>
              <span>{formatTime(result.totalDuration)} נסיעה</span>
            </div>

            {result.isOptimal ? (
              <span className="flex items-center gap-1 text-green-600">
                <Check size={11} /> סדר אופטימלי
              </span>
            ) : (
              <span className="text-amber-600">
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
                className="flex items-center gap-1 text-xs bg-indigo-600 text-white px-2.5 py-1 rounded-full hover:bg-indigo-700 transition-colors font-medium"
              >
                <Sparkles size={10} />
                החל סדר מיטבי
              </button>
            )}

            {result.missingCoords > 0 && (
              <span className="text-amber-500">
                ({result.missingCoords} לא נכללו — חסר מיקום)
              </span>
            )}

            <button
              onClick={() => setStatus('idle')}
              className="ms-auto text-gray-300 hover:text-gray-500"
            >✕</button>
          </div>

          {/* Route visualization — always LTR so arrows point correctly */}
          <div className="flex flex-wrap items-center gap-1 text-xs" dir="ltr">
            {result.orderedNodes.map((node, i) => (
              <span key={`${node.id}-${i}`} className="flex items-center gap-1">
                <span className={`px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${nodeBadge(node.role)}`}>
                  {nodeLabel(node.role, node.name)}
                </span>
                {i < result.orderedNodes.length - 1 && (
                  <span className="flex items-center gap-0.5 text-gray-400">
                    <ArrowRight size={10} />
                    <span className="text-gray-500">{formatTime(result.legs[i].duration)}</span>
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

// Nearest-neighbor through middleIndices, departing from prevIdx (may be null)
function optimizeMiddle(matrix, middleIndices, prevIdx) {
  if (middleIndices.length === 0) return [];
  if (middleIndices.length === 1) return middleIndices;

  const remaining = new Set(middleIndices);
  const order = [];
  let current = prevIdx;

  // If we have a departure point, find nearest unvisited
  // Otherwise just start from the first middle index
  if (current === null) {
    current = middleIndices[0];
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
