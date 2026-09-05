import { useState, useRef } from 'react';
import { Plus, ExternalLink, Hotel, MapPin, Utensils, Star, Search, X, ShoppingBag, Compass, SlidersHorizontal, ChevronDown } from 'lucide-react';
import PlaceDetailModal from './PlaceDetailModal';
import PlaceEditModal from './PlaceEditModal';

const TYPE_ICONS = { hotel: Hotel, attraction: MapPin, restaurant: Utensils, shopping: ShoppingBag, area: Compass, other: Star };
const STATUS_STYLES = {
  booked:      { background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac' },
  considering: { background: 'var(--c-amber-light)', color: 'var(--c-amber)', border: '1px solid var(--c-amber-mid)' },
  visited:     { background: 'var(--c-vellum)', color: 'var(--c-muted)', border: '1px solid var(--c-border)' },
  abandoned:   { background: '#f1f5f9', color: '#94a3b8', border: '1px solid #cbd5e1', textDecoration: 'line-through' },
};
const STATUS_LEFT_BORDER = {
  booked:      '#16a34a',
  considering: 'var(--c-amber)',
  visited:     'var(--c-border)',
  abandoned:   '#cbd5e1',
};

export default function PlacesView({ store, t, isReadOnly }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterTags, setFilterTags] = useState(new Set());
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewPlace, setViewPlace] = useState(null);
  const [editPlace, setEditPlace] = useState(null);
  const searchRef = useRef(null);

  const STATUSES = ['all', 'booked', 'considering', 'visited', 'abandoned'];
  const TYPES = ['all', 'hotel', 'attraction', 'restaurant', 'shopping', 'area', 'other'];

  const allTags = [...new Set(store.places.flatMap((p) => p.tags ?? []))].sort();
  const allRegions = [...new Set(store.places.map((p) => p.region).filter(Boolean))].sort();

  const toggleTag = (tag) => {
    setFilterTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const q = search.trim().toLowerCase();

  const suggestions = q.length >= 1
    ? store.places
        .filter((p) => p.name.toLowerCase().includes(q) && p.name.toLowerCase() !== q)
        .slice(0, 6)
    : [];

  const filtered = store.places.filter((p) => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterType !== 'all' && p.type !== filterType) return false;
    if (filterRegion !== 'all' && p.region !== filterRegion) return false;
    if (filterTags.size > 0 && !([...filterTags].some((tag) => p.tags?.includes(tag)))) return false;
    if (q && !p.name.toLowerCase().includes(q) && !p.description?.toLowerCase().includes(q) && !p.tags?.some((tag) => tag.toLowerCase().includes(q))) return false;
    return true;
  });

  const activeFilterCount = (filterStatus !== 'all' ? 1 : 0) + (filterType !== 'all' ? 1 : 0) +
    (filterRegion !== 'all' ? 1 : 0) + filterTags.size;

  const clearAllFilters = () => {
    setFilterStatus('all'); setFilterType('all');
    setFilterRegion('all'); setFilterTags(new Set());
  };

  const handleEdit = (place) => {
    setViewPlace(null);
    setEditPlace(place);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-3 space-y-2">

        {/* Search + Filter toggle + Add */}
        <div className="flex gap-2">
          <div className="relative flex-1" ref={searchRef}>
            <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--c-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder={t.places.searchPlaceholder}
              className="w-full ps-8 pe-8 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
              style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-ink)', '--tw-ring-color': 'var(--c-amber)' }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute end-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-muted)' }}>
                <X size={14} />
              </button>
            )}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full mt-1 w-full rounded-xl shadow-lg z-20 overflow-hidden" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
                {suggestions.map((p) => {
                  const Icon = TYPE_ICONS[p.type] || Star;
                  return (
                    <button
                      key={p.id}
                      onMouseDown={() => { setSearch(p.name); setShowSuggestions(false); }}
                      className="w-full text-start px-3 py-2 text-sm flex items-center gap-2 transition-colors"
                      style={{ color: 'var(--c-ink)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--c-amber-light)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <Icon size={13} style={{ color: 'var(--c-muted)' }} className="shrink-0" />
                      <span className="truncate">{p.name}</span>
                      <span className="ms-auto text-xs px-1.5 py-0.5 rounded-full shrink-0" style={STATUS_STYLES[p.status] ?? {}}>
                        {t.places[p.status] || p.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors shrink-0"
            style={{
              background: showFilters || activeFilterCount > 0 ? 'var(--c-ink)' : 'var(--c-surface)',
              color: showFilters || activeFilterCount > 0 ? 'var(--c-vellum)' : 'var(--c-muted)',
              border: `1px solid ${showFilters || activeFilterCount > 0 ? 'var(--c-ink)' : 'var(--c-border)'}`,
            }}
          >
            <SlidersHorizontal size={14} />
            {store.language === 'he' ? 'סינון' : 'Filter'}
            {activeFilterCount > 0 && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--c-amber)', color: 'white' }}>
                {activeFilterCount}
              </span>
            )}
            <ChevronDown size={12} style={{ transform: showFilters ? 'rotate(180deg)' : '', transition: 'transform 0.15s' }} />
          </button>

          {!isReadOnly && (
            <button
              onClick={() => setEditPlace('new')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 shrink-0"
              style={{ background: 'var(--c-ink)', color: 'var(--c-vellum)' }}
            >
              <Plus size={15} />
              {t.places.addPlace}
            </button>
          )}
        </div>

        {/* Collapsible filter panel */}
        {showFilters && (
          <div className="rounded-xl p-3 space-y-3" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>

            {/* Status */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--c-muted)' }}>
                {store.language === 'he' ? 'סטטוס' : 'Status'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s) => {
                  const count = s === 'all' ? store.places.length : store.places.filter((p) => p.status === s).length;
                  const active = filterStatus === s;
                  return (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      className="px-2.5 py-1 text-xs rounded-full transition-all flex items-center gap-1"
                      style={{ background: active ? 'var(--c-ink)' : 'var(--c-vellum)', color: active ? 'var(--c-vellum)' : 'var(--c-muted)', border: `1px solid ${active ? 'var(--c-ink)' : 'var(--c-border)'}` }}>
                      {t.places[s] || s} <span className="opacity-50">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Type */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--c-muted)' }}>
                {store.language === 'he' ? 'סוג' : 'Type'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {TYPES.filter((tp) => tp === 'all' || store.places.some((p) => p.type === tp)).map((tp) => {
                  const active = filterType === tp;
                  const Icon = tp !== 'all' ? TYPE_ICONS[tp] : null;
                  return (
                    <button key={tp} onClick={() => setFilterType(tp)}
                      className="px-2.5 py-1 text-xs rounded-full transition-all flex items-center gap-1"
                      style={{ background: active ? 'var(--c-amber)' : 'var(--c-vellum)', color: active ? 'white' : 'var(--c-muted)', border: `1px solid ${active ? 'var(--c-amber)' : 'var(--c-border)'}` }}>
                      {Icon && <Icon size={10} />}
                      {t.places[tp] || tp}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Region */}
            {allRegions.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--c-muted)' }}>
                  {store.language === 'he' ? 'איזור' : 'Region'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {allRegions.map((region) => {
                    const active = filterRegion === region;
                    return (
                      <button key={region} onClick={() => setFilterRegion(active ? 'all' : region)}
                        className="px-2.5 py-1 text-xs rounded-full transition-all"
                        style={{ background: active ? 'var(--c-ink)' : 'var(--c-vellum)', color: active ? 'var(--c-vellum)' : 'var(--c-muted)', border: `1px solid ${active ? 'var(--c-ink)' : 'var(--c-border)'}` }}>
                        {region}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tags */}
            {allTags.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--c-muted)' }}>
                  {store.language === 'he' ? 'תגיות' : 'Tags'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map((tag) => (
                    <button key={tag} onClick={() => toggleTag(tag)}
                      className="px-2.5 py-1 text-xs rounded-full transition-all"
                      style={{ background: filterTags.has(tag) ? 'var(--c-ink)' : 'var(--c-vellum)', color: filterTags.has(tag) ? 'var(--c-vellum)' : 'var(--c-muted)', border: `1px solid ${filterTags.has(tag) ? 'var(--c-ink)' : 'var(--c-border)'}` }}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className="text-xs transition-colors" style={{ color: 'var(--c-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--c-muted)'}>
                ✕ {store.language === 'he' ? 'נקה הכל' : 'Clear all'}
              </button>
            )}
          </div>
        )}

        {/* Active filter chips summary (when panel is closed) */}
        {!showFilters && activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {filterStatus !== 'all' && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--c-ink)', color: 'var(--c-vellum)' }}>
                {t.places[filterStatus]}
                <button onClick={() => setFilterStatus('all')}><X size={10} /></button>
              </span>
            )}
            {filterType !== 'all' && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--c-amber)', color: 'white' }}>
                {t.places[filterType]}
                <button onClick={() => setFilterType('all')}><X size={10} /></button>
              </span>
            )}
            {filterRegion !== 'all' && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--c-vellum)', color: 'var(--c-ink)', border: '1px solid var(--c-border)' }}>
                {filterRegion}
                <button onClick={() => setFilterRegion('all')}><X size={10} /></button>
              </span>
            )}
            {[...filterTags].map((tag) => (
              <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--c-vellum)', color: 'var(--c-ink)', border: '1px solid var(--c-border)' }}>
                {tag}
                <button onClick={() => toggleTag(tag)}><X size={10} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      {store.places.length === 0 ? (
        <div className="text-center py-20 text-sm rounded-xl border border-dashed" style={{ color: 'var(--c-muted)', background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
          {t.places.noPlaces}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-sm" style={{ color: 'var(--c-muted)' }}>
          {t.places.noResults}
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--c-border)' }}>
          {filtered.map((place, idx) => {
            const Icon = TYPE_ICONS[place.type] || Star;
            const borderColor = STATUS_LEFT_BORDER[place.status] ?? 'var(--c-border)';
            return (
              <div
                key={place.id}
                onClick={() => setViewPlace(place)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                style={{
                  background: 'var(--c-surface)',
                  borderBottom: idx < filtered.length - 1 ? '1px solid var(--c-border)' : 'none',
                  borderInlineStart: `3px solid ${borderColor}`,
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--c-vellum)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--c-surface)'}
              >
                {/* Icon */}
                <div className="shrink-0 p-1.5 rounded-lg" style={{ background: 'var(--c-vellum)' }}>
                  <Icon size={14} style={{ color: 'var(--c-amber)' }} />
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span
                      className="font-medium text-sm truncate"
                      style={{ color: 'var(--c-ink)', textDecoration: place.status === 'abandoned' ? 'line-through' : 'none' }}
                    >
                      {place.name}
                    </span>
                    {place.region && (
                      <span className="text-xs shrink-0" style={{ color: 'var(--c-amber)' }}>{place.region}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 min-w-0">
                    <span className="text-xs shrink-0" style={{ color: 'var(--c-muted)' }}>{t.places[place.type] || place.type}</span>
                    {place.tags?.length > 0 && (
                      <>
                        <span style={{ color: 'var(--c-border)' }}>·</span>
                        <span className="text-xs truncate" style={{ color: 'var(--c-muted)' }}>
                          {place.tags.slice(0, 3).join(', ')}{place.tags.length > 3 ? ` +${place.tags.length - 3}` : ''}
                        </span>
                      </>
                    )}
                    {place.description && (
                      <>
                        <span style={{ color: 'var(--c-border)' }}>·</span>
                        <span className="text-xs truncate" style={{ color: 'var(--c-muted)' }}>{place.description}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2 shrink-0">
                  {place.bookingUrl && (
                    <a
                      href={place.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="transition-colors"
                      style={{ color: 'var(--c-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--c-amber)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--c-muted)'}
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={STATUS_STYLES[place.status] ?? { background: 'var(--c-vellum)', color: 'var(--c-muted)' }}>
                    {t.places[place.status] || place.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewPlace && (
        <PlaceDetailModal
          place={viewPlace}
          store={store}
          t={t}
          onClose={() => setViewPlace(null)}
          isReadOnly={isReadOnly}
        />
      )}

      {!isReadOnly && editPlace !== null && (
        <PlaceEditModal
          place={editPlace === 'new' ? null : editPlace}
          store={store}
          t={t}
          onClose={() => setEditPlace(null)}
        />
      )}
    </div>
  );
}
