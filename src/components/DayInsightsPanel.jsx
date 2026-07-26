import { useState } from 'react';
import { Car, RotateCw, AlertCircle, Check, ArrowRight, MapPin } from 'lucide-react';
import { getDistanceMatrix, nearestNeighborTSP, routeCost } from '../routeApi';

function formatTime(seconds) {
  if (seconds == null) return '—';
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min} דק'`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}ש' ${m}דק'` : `${h}ש'`;
}

function formatDist(meters) {
  if (meters == null) return '—';
  const km = Math.round(meters / 100) / 10;
  return `${km} ק"מ`;
}

export default function DayInsightsPanel({ day, places }) {
  const [status, setStatus] = useState('idle'); // idle | loading | done | error | no-coords
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Build stop list: hotel first (if linked), then day.stops[]
  const hotel = day.accommodationId ? places.find((p) => p.id === day.accommodationId) : null;
  const stopPlaces = (day.stops ?? [])
    .map((id) => places.find((p) => p.id === id))
    .filter(Boolean);

  const allStops = [
    ...(hotel ? [{ ...hotel, role: 'hotel' }] : []),
    ...stopPlaces.map((p) => ({ ...p, role: 'stop' })),
  ];

  const geocodedStops = allStops.filter((s) => s.lat != null && s.lon != null);
  const missingCoords = allStops.length - geocodedStops.length;

  if (allStops.length < 2) {
    return (
      <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-t border-gray-100 italic">
        הוסף עצירות ביום זה (לינה + לפחות עוד מקום אחד) כדי לחשב מסלול
      </div>
    );
  }

  const calculate = async () => {
    if (geocodedStops.length < 2) {
      setStatus('no-coords');
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    try {
      const coords = geocodedStops.map((s) => ({ lat: s.lat, lon: s.lon }));
      const { durations, distances } = await getDistanceMatrix(coords);

      const n = geocodedStops.length;
      const currentOrder = geocodedStops.map((_, i) => i);
      const currentDuration = routeCost(durations, currentOrder);
      const currentDistance = routeCost(distances, currentOrder);

      const { order: optOrder } = nearestNeighborTSP(durations, 0);
      const optDuration = routeCost(durations, optOrder);
      const optDistance = routeCost(distances, optOrder);

      const legs = optOrder.slice(0, -1).map((fromIdx, i) => {
        const toIdx = optOrder[i + 1];
        return {
          from: geocodedStops[fromIdx].name,
          to: geocodedStops[toIdx].name,
          duration: durations[fromIdx][toIdx],
          distance: distances[fromIdx][toIdx],
        };
      });

      const savedSec = currentDuration - optDuration;
      const isOptimal = savedSec < 60;

      setResult({
        totalDuration: optDuration,
        totalDistance: optDistance,
        savedSec,
        isOptimal,
        orderedStops: optOrder.map((i) => geocodedStops[i]),
        legs,
        missingCoords,
      });
      setStatus('done');
    } catch (e) {
      setErrorMsg(e.message || 'שגיאה בחישוב מרחקים');
      setStatus('error');
    }
  };

  return (
    <div className="border-t border-indigo-100 bg-indigo-50/30 px-4 py-2.5">
      {status === 'idle' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin size={11} className="text-indigo-400" />
              {allStops.length} עצירות
            </span>
            {missingCoords > 0 && (
              <span className="text-amber-600 flex items-center gap-1">
                <AlertCircle size={11} />
                {missingCoords} ללא מיקום
              </span>
            )}
          </div>
          <button
            onClick={calculate}
            disabled={geocodedStops.length < 2}
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
          <button onClick={calculate} className="underline ms-1 text-red-500 hover:text-red-700">נסה שוב</button>
        </div>
      )}

      {status === 'no-coords' && (
        <div className="text-xs text-amber-600 flex items-center gap-1.5">
          <AlertCircle size={12} />
          חסרות קואורדינטות — פתח את המקום והוסף כתובת לאימות מיקום
        </div>
      )}

      {status === 'done' && result && (
        <div className="space-y-2">
          {/* Summary row */}
          <div className="flex items-center gap-4 flex-wrap text-xs">
            <div className="flex items-center gap-3 font-medium text-gray-700">
              <span className="flex items-center gap-1">
                <Car size={12} className="text-indigo-500" />
                {formatDist(result.totalDistance)}
              </span>
              <span className="text-gray-400">·</span>
              <span>{formatTime(result.totalDuration)} נסיעה</span>
            </div>

            {result.isOptimal ? (
              <span className="flex items-center gap-1 text-green-600">
                <Check size={11} />
                סדר אופטימלי
              </span>
            ) : (
              <span className="text-amber-600">
                הסדר הנוכחי ארוך ב-{formatTime(result.savedSec)} מהמיטבי
              </span>
            )}

            {result.missingCoords > 0 && (
              <span className="text-amber-500">({result.missingCoords} מקומות לא נכללו — חסר מיקום)</span>
            )}

            <button
              onClick={() => setStatus('idle')}
              className="ms-auto text-gray-300 hover:text-gray-500 transition-colors"
              title="סגור"
            >
              ✕
            </button>
          </div>

          {/* Route visualization */}
          <div className="flex flex-wrap items-center gap-1 text-xs">
            {result.orderedStops.map((stop, i) => (
              <span key={stop.id} className="flex items-center gap-1">
                <span
                  className={`px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                    stop.role === 'hotel'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {stop.name.length > 22 ? stop.name.slice(0, 22) + '…' : stop.name}
                </span>
                {i < result.orderedStops.length - 1 && (
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
