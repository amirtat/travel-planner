import { useState, useCallback } from 'react';
import {
  Car, PersonStanding, Bike, Search, RefreshCw, AlertCircle,
  Clock, Ruler, MapPin, CheckCircle2, ChevronUp, ChevronDown, ChevronsUpDown, X,
} from 'lucide-react';
import { photonSearch, photonReverse, getRoute, parseGoogleMapsUrl } from '../routeApi';

const MODES = [
  { key: 'car',     Icon: Car,             label: { he: 'רכב',    en: 'Car' } },
  { key: 'walking', Icon: PersonStanding,  label: { he: 'הליכה',  en: 'Walking' } },
  { key: 'bicycle', Icon: Bike,            label: { he: 'אופניים', en: 'Bicycle' } },
];

const TYPES = ['hotel', 'attraction', 'restaurant', 'other'];

function timeBadge(min, greenMax = 30, yellowMax = 60) {
  if (min == null) return null;
  if (min <= greenMax)  return { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' };
  if (min <= yellowMax) return { bg: 'bg-amber-100',   text: 'text-amber-800',   dot: 'bg-amber-500' };
  return                       { bg: 'bg-red-100',     text: 'text-red-800',     dot: 'bg-red-500' };
}

function formatTime(min) {
  if (min == null) return '—';
  if (min < 60) return `${min} דק'`;
  const h = Math.floor(min / 60), m = min % 60;
  return m > 0 ? `${h}ש' ${m}דק'` : `${h}ש'`;
}

function SortHeader({ col, label, sortCol, sortAsc, onSort }) {
  const active = sortCol === col;
  return (
    <th
      onClick={() => onSort(col)}
      className="px-3 py-3 text-start text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none group whitespace-nowrap"
    >
      <span className="flex items-center gap-1">
        {label}
        {active
          ? sortAsc ? <ChevronUp size={11} className="text-blue-500" /> : <ChevronDown size={11} className="text-blue-500" />
          : <ChevronsUpDown size={11} className="text-gray-300 group-hover:text-gray-400" />
        }
      </span>
    </th>
  );
}

export default function BuiltinCalculator({ store, t }) {
  const lang = store.language;
  const typeLabel = { hotel: t.places.hotel, attraction: t.places.attraction, restaurant: t.places.restaurant, other: t.places.other };

  // Origin state
  const [originText, setOriginText] = useState('');
  const [originCoords, setOriginCoords] = useState(null);
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [originSearching, setOriginSearching] = useState(false);

  // Filters
  const [mode, setMode] = useState('car');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTag, setFilterTag] = useState('');

  // Results
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [calculated, setCalculated] = useState(false);

  // Sort
  const [sortCol, setSortCol] = useState('duration');
  const [sortAsc, setSortAsc] = useState(true);

  // Route cache (session only)
  const [routeCache, setRouteCache] = useState({});

  const allTags = [...new Set(store.places.flatMap((p) => p.tags ?? []))].sort();

  const filteredPlaces = store.places.filter((p) => {
    if (filterType !== 'all' && p.type !== filterType) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterTag && !(p.tags ?? []).includes(filterTag)) return false;
    return true;
  });

  const geocodedPlaces = filteredPlaces.filter((p) => p.lat != null && p.lon != null);
  const missingCoords = filteredPlaces.length - geocodedPlaces.length;

  // Origin search
  const searchOrigin = async () => {
    if (!originText.trim()) return;

    // Try Google Maps URL first
    const gmCoords = parseGoogleMapsUrl(originText);
    if (gmCoords) {
      setOriginCoords(gmCoords);
      setOriginSuggestions([]);
      if (gmCoords.name) {
        setOriginText(gmCoords.name);
      } else {
        const name = await photonReverse(gmCoords.lat, gmCoords.lon);
        if (name) setOriginText(name);
      }
      return;
    }

    setOriginSearching(true);
    setOriginSuggestions([]);
    try {
      const results = await photonSearch(originText, 5);
      setOriginSuggestions(results);
    } catch {
      // ignore
    }
    setOriginSearching(false);
  };

  const selectOrigin = (r) => {
    setOriginText(r.displayName);
    setOriginCoords({ lat: r.lat, lon: r.lon });
    setOriginSuggestions([]);
  };

  // Auto-detect Google Maps URL on paste/change
  const handleOriginChange = async (e) => {
    const val = e.target.value;
    setOriginText(val);
    if (originCoords) setOriginCoords(null);
    const gmCoords = parseGoogleMapsUrl(val);
    if (gmCoords) {
      setOriginCoords(gmCoords);
      if (gmCoords.name) {
        setOriginText(gmCoords.name);
      } else {
        const name = await photonReverse(gmCoords.lat, gmCoords.lon);
        if (name) setOriginText(name);
      }
    }
  };

  const clearOrigin = () => {
    setOriginText('');
    setOriginCoords(null);
    setOriginSuggestions([]);
    setCalculated(false);
    setResults([]);
  };

  // Calculate
  const calculate = async (forceRefresh = false) => {
    if (!originCoords) return;
    if (geocodedPlaces.length === 0) return;

    setLoading(true);
    setErrors([]);
    setResults([]);

    const newResults = [];
    const errs = [];
    const newCache = { ...routeCache };

    for (const place of geocodedPlaces) {
      const cacheKey = `${mode}:${originCoords.lat},${originCoords.lon}:${place.lat},${place.lon}`;
      if (!forceRefresh && newCache[cacheKey]) {
        newResults.push({ place, ...newCache[cacheKey], fromCache: true });
        continue;
      }
      try {
        const res = await getRoute(originCoords.lat, originCoords.lon, place.lat, place.lon, mode);
        newCache[cacheKey] = res;
        newResults.push({ place, ...res, fromCache: false });
      } catch {
        errs.push(place.name);
        newResults.push({ place, distance_km: null, duration_min: null, error: true });
      }
      await new Promise((r) => setTimeout(r, 80));
    }

    setRouteCache(newCache);
    setResults(newResults);
    setErrors(errs);
    setLoading(false);
    setCalculated(true);
  };

  const handleSort = (col) => {
    if (sortCol === col) setSortAsc((a) => !a);
    else { setSortCol(col); setSortAsc(true); }
  };

  const sortedResults = [...results].sort((a, b) => {
    let va, vb;
    if (sortCol === 'name') { va = a.place.name; vb = b.place.name; }
    else if (sortCol === 'type') { va = a.place.type; vb = b.place.type; }
    else if (sortCol === 'dist') { va = a.distance_km ?? Infinity; vb = b.distance_km ?? Infinity; }
    else { va = a.duration_min ?? Infinity; vb = b.duration_min ?? Infinity; }
    if (typeof va === 'string') return sortAsc ? va.localeCompare(vb, lang) : vb.localeCompare(va, lang);
    return sortAsc ? va - vb : vb - va;
  });

  return (
    <div className="space-y-4">

      {/* Controls card */}
      <div className="rounded-xl p-4 space-y-4" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>

        {/* Origin */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            {lang === 'he' ? 'נקודת מוצא' : 'Starting Point'}
          </label>
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={originText}
                  onChange={handleOriginChange}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchOrigin())}
                  placeholder={lang === 'he' ? 'חפש כתובת או הדבק קישור Google Maps...' : 'Search address or paste Google Maps link...'}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 pe-8"
                style={{
                  background: originCoords ? '#f0fdf4' : 'var(--c-vellum)',
                  border: `1px solid ${originCoords ? '#86efac' : 'var(--c-border)'}`,
                  color: 'var(--c-ink)',
                }}
                />
                {originText && (
                  <button onClick={clearOrigin} className="absolute end-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                onClick={searchOrigin}
                disabled={originSearching || !originText.trim()}
                className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg disabled:opacity-40 transition-opacity hover:opacity-80 whitespace-nowrap"
              style={{ background: 'var(--c-ink)', color: 'var(--c-vellum)' }}
              >
                {originSearching ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                {lang === 'he' ? 'חפש' : 'Search'}
              </button>
            </div>
            {originCoords && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle2 size={11} />
                {parseGoogleMapsUrl(originText)
                  ? (lang === 'he' ? 'קואורדינטות מ-Google Maps' : 'Coordinates from Google Maps')
                  : (lang === 'he' ? 'מיקום אומת' : 'Location confirmed')}
              </p>
            )}
            {originSuggestions.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                {originSuggestions.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => selectOrigin(r)}
                    className="w-full text-start px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 border-b border-gray-100 last:border-0"
                  >
                    {r.displayName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mode + Filters row */}
        <div className="flex flex-wrap gap-3 items-end">
          {/* Travel mode */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              {lang === 'he' ? 'אמצעי תחבורה' : 'Travel Mode'}
            </label>
            <div className="flex rounded-lg overflow-hidden h-9" style={{ border: '1px solid var(--c-border)' }}>
              {MODES.map(({ key, Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className="flex items-center justify-center gap-1 px-3 text-xs font-medium transition-all"
                  style={{
                    background: mode === key ? 'var(--c-ink)' : 'var(--c-surface)',
                    color: mode === key ? 'var(--c-vellum)' : 'var(--c-muted)',
                  }}
                  title={label[lang]}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{label[lang]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Type filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              {lang === 'he' ? 'סוג' : 'Type'}
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
                className="h-9 rounded-lg px-2 text-sm focus:outline-none"
              style={{ border: '1px solid var(--c-border)', color: 'var(--c-ink)', background: 'var(--c-surface)' }}
            >
              <option value="all">{t.places.all}</option>
              {TYPES.map((tp) => (
                <option key={tp} value={tp}>{typeLabel[tp]}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--c-muted)' }}>
              {lang === 'he' ? 'סטטוס' : 'Status'}
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 rounded-lg px-2 text-sm focus:outline-none"
              style={{ border: '1px solid var(--c-border)', color: 'var(--c-ink)', background: 'var(--c-surface)' }}
            >
              <option value="all">{t.places.all}</option>
              <option value="booked">{t.places.booked}</option>
              <option value="considering">{t.places.considering}</option>
              <option value="visited">{t.places.visited}</option>
            </select>
          </div>

          {/* Tag filter */}
          {allTags.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                {lang === 'he' ? 'תגית' : 'Tag'}
              </label>
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="h-9 rounded-lg px-2 text-sm focus:outline-none"
                style={{ border: '1px solid var(--c-border)', color: 'var(--c-ink)', background: 'var(--c-surface)' }}
              >
                <option value="">{t.places.all}</option>
                {allTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
              </select>
            </div>
          )}

          {/* Calculate button */}
          <button
            onClick={() => calculate(false)}
            disabled={loading || !originCoords || geocodedPlaces.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-80 h-9 ms-auto"
            style={{ background: 'var(--c-ink)', color: 'var(--c-vellum)' }}
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
            {loading
              ? (lang === 'he' ? 'מחשב...' : 'Calculating...')
              : (lang === 'he' ? 'חשב מרחקים' : 'Calculate')
            }
          </button>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
          <span>{lang === 'he' ? `${filteredPlaces.length} מקומות` : `${filteredPlaces.length} places`}</span>
          {missingCoords > 0 && (
            <span className="text-amber-500 flex items-center gap-1">
              <AlertCircle size={11} />
              {lang === 'he'
                ? `${missingCoords} ללא קואורדינטות — פתח את המקום והוסף כתובת`
                : `${missingCoords} missing coordinates — edit the place and add address`}
            </span>
          )}
          {calculated && !loading && (
            <button
              onClick={() => calculate(true)}
              className="ms-auto flex items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <RefreshCw size={11} />
              {lang === 'he' ? 'רענן' : 'Refresh'}
            </button>
          )}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 space-y-0.5">
          {errors.map((e, i) => (
            <div key={i} className="flex items-center gap-2">
              <AlertCircle size={12} className="shrink-0" />
              {lang === 'he' ? `שגיאה בחישוב מסלול אל: "${e}"` : `Error calculating route to: "${e}"`}
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {sortedResults.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--c-vellum)', borderBottom: '1px solid var(--c-border)' }}>
                  <SortHeader col="name"     label={lang === 'he' ? 'מקום'    : 'Place'}    sortCol={sortCol} sortAsc={sortAsc} onSort={handleSort} />
                  <SortHeader col="type"     label={lang === 'he' ? 'סוג'     : 'Type'}     sortCol={sortCol} sortAsc={sortAsc} onSort={handleSort} />
                  <SortHeader col="duration" label={lang === 'he' ? 'זמן נסיעה' : 'Time'}  sortCol={sortCol} sortAsc={sortAsc} onSort={handleSort} />
                  <SortHeader col="dist"     label={lang === 'he' ? 'מרחק'    : 'Distance'} sortCol={sortCol} sortAsc={sortAsc} onSort={handleSort} />
                  <th className="w-6 px-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedResults.map(({ place, distance_km, duration_min, error, fromCache }) => {
                  const badge = timeBadge(duration_min, store.travelGreenMax ?? 30, store.travelYellowMax ?? 60);
                  return (
                    <tr key={place.id} className="transition-colors" onMouseEnter={e => e.currentTarget.style.background='var(--c-vellum)'} onMouseLeave={e => e.currentTarget.style.background=''}>
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-800">{place.name}</div>
                        {place.description && (
                          <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{place.description}</div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs text-gray-500">{typeLabel[place.type] || place.type}</span>
                      </td>
                      <td className="px-3 py-3">
                        {error ? <span className="text-red-400 text-xs">—</span> : badge && (
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-1 ${badge.bg} ${badge.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {formatTime(duration_min)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {error
                          ? <span className="text-red-400 text-xs">—</span>
                          : <span className="text-gray-700 font-medium">{distance_km} ק"מ</span>
                        }
                      </td>
                      <td className="px-2 py-3">
                        {fromCache && !error && (
                          <CheckCircle2 size={12} className="text-gray-300" title={lang === 'he' ? 'מה-cache' : 'Cached'} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 flex items-center gap-5 flex-wrap" style={{ background: 'var(--c-vellum)', borderTop: '1px solid var(--c-border)' }}>
            {(() => {
              const g = store.travelGreenMax ?? 30;
              const y = store.travelYellowMax ?? 60;
              const min = lang === 'he' ? 'דק\'' : 'min';
              return [
                { dot: 'bg-emerald-500', label: `≤ ${g} ${min}` },
                { dot: 'bg-amber-500',   label: `${g}–${y} ${min}` },
                { dot: 'bg-red-500',     label: `> ${y} ${min}` },
              ];
            })().map(({ dot, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className={`w-2 h-2 rounded-full ${dot}`} />{label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !calculated && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center mb-4">
            <Ruler size={22} className="text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">
            {!originCoords
              ? (lang === 'he' ? 'הכנס נקודת מוצא ולחץ על חשב מרחקים' : 'Enter a starting point and click Calculate')
              : geocodedPlaces.length === 0
              ? (lang === 'he' ? 'אין מקומות עם קואורדינטות. הוסף כתובת למקומות.' : 'No places with coordinates. Add addresses to your places.')
              : (lang === 'he' ? 'לחץ על חשב מרחקים' : 'Click Calculate')
            }
          </p>
        </div>
      )}
    </div>
  );
}
