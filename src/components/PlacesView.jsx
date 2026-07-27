import { useState, useRef } from 'react';
import { Plus, ExternalLink, Hotel, MapPin, Utensils, Star, Search, X } from 'lucide-react';
import PlaceDetailModal from './PlaceDetailModal';
import PlaceEditModal from './PlaceEditModal';

const TYPE_ICONS = { hotel: Hotel, attraction: MapPin, restaurant: Utensils, other: Star };
const STATUS_STYLES = {
  booked:      { background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac' },
  considering: { background: 'var(--c-amber-light)', color: 'var(--c-amber)', border: '1px solid var(--c-amber-mid)' },
  visited:     { background: 'var(--c-vellum)', color: 'var(--c-muted)', border: '1px solid var(--c-border)' },
};

export default function PlacesView({ store, t }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTags, setFilterTags] = useState(new Set());
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [viewPlace, setViewPlace] = useState(null);
  const [editPlace, setEditPlace] = useState(null);
  const searchRef = useRef(null);

  const STATUSES = ['all', 'booked', 'considering', 'visited'];

  const allTags = [...new Set(store.places.flatMap((p) => p.tags ?? []))].sort();

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
    if (filterTags.size > 0 && !([...filterTags].some((tag) => p.tags?.includes(tag)))) return false;
    if (q && !p.name.toLowerCase().includes(q) && !p.description?.toLowerCase().includes(q) && !p.tags?.some((tag) => tag.toLowerCase().includes(q))) return false;
    return true;
  });

  const handleEdit = (place) => {
    setViewPlace(null);
    setEditPlace(place);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 space-y-2">
        {/* Search */}
        <div className="relative" ref={searchRef}>
          <div className="relative flex items-center">
            <Search size={14} className="absolute start-3 pointer-events-none" style={{ color: 'var(--c-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder={t.places.searchPlaceholder}
              className="w-full ps-8 pe-8 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
              style={{
                background: 'var(--c-surface)',
                border: '1px solid var(--c-border)',
                color: 'var(--c-ink)',
                '--tw-ring-color': 'var(--c-amber)',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute end-2.5"
                style={{ color: 'var(--c-muted)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div
              className="absolute top-full mt-1 w-full rounded-xl shadow-lg z-20 overflow-hidden"
              style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
            >
              {suggestions.map((p) => (
                <button
                  key={p.id}
                  onMouseDown={() => { setSearch(p.name); setShowSuggestions(false); }}
                  className="w-full text-start px-3 py-2 text-sm flex items-center gap-2 transition-colors"
                  style={{ color: 'var(--c-ink)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--c-amber-light)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  {(() => { const Icon = TYPE_ICONS[p.type] || Star; return <Icon size={13} style={{ color: 'var(--c-muted)' }} className="shrink-0" />; })()}
                  <span className="truncate">{p.name}</span>
                  <span className="ms-auto text-xs px-1.5 py-0.5 rounded-full shrink-0"
                    style={STATUS_STYLES[p.status] ?? { background: 'var(--c-vellum)', color: 'var(--c-muted)' }}>
                    {t.places[p.status] || p.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUSES.map((s) => {
              const count = s === 'all' ? store.places.length : store.places.filter((p) => p.status === s).length;
              const active = filterStatus === s;
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className="px-3 py-1.5 text-sm rounded-full transition-all flex items-center gap-1"
                  style={{
                    background: active ? 'var(--c-ink)' : 'var(--c-surface)',
                    color: active ? 'var(--c-vellum)' : 'var(--c-muted)',
                    border: `1px solid ${active ? 'var(--c-ink)' : 'var(--c-border)'}`,
                  }}
                >
                  {t.places[s] || s}
                  <span className="text-xs opacity-60">({count})</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setEditPlace('new')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--c-ink)', color: 'var(--c-vellum)' }}
          >
            <Plus size={15} />
            {t.places.addPlace}
          </button>
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className="px-2.5 py-1 text-xs rounded-full transition-all"
                style={{
                  background: filterTags.has(tag) ? 'var(--c-ink)' : 'var(--c-surface)',
                  color: filterTags.has(tag) ? 'var(--c-vellum)' : 'var(--c-muted)',
                  border: `1px solid ${filterTags.has(tag) ? 'var(--c-ink)' : 'var(--c-border)'}`,
                }}
              >
                {tag}
              </button>
            ))}
            {filterTags.size > 0 && (
              <button
                onClick={() => setFilterTags(new Set())}
                className="text-xs ms-1 transition-colors"
                style={{ color: 'var(--c-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--c-muted)'}
              >
                ✕ נקה
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      {store.places.length === 0 ? (
        <div
          className="text-center py-20 text-sm rounded-xl border border-dashed"
          style={{ color: 'var(--c-muted)', background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
        >
          {t.places.noPlaces}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-sm" style={{ color: 'var(--c-muted)' }}>
          {t.places.noResults}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((place) => {
            const Icon = TYPE_ICONS[place.type] || Star;
            return (
              <div
                key={place.id}
                onClick={() => setViewPlace(place)}
                className="rounded-xl p-4 cursor-pointer transition-all"
                style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--c-amber)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(156,106,34,0.12)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--c-border)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg" style={{ background: 'var(--c-vellum)' }}>
                      <Icon size={14} style={{ color: 'var(--c-amber)' }} />
                    </div>
                    <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{t.places[place.type] || place.type}</span>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                    style={STATUS_STYLES[place.status] ?? { background: 'var(--c-vellum)', color: 'var(--c-muted)' }}
                  >
                    {t.places[place.status] || place.status}
                  </span>
                </div>

                <h3 className="font-semibold mb-0.5 line-clamp-2 text-sm" style={{ color: 'var(--c-ink)' }}>
                  {place.name}
                </h3>

                {place.region && (
                  <p className="text-xs mb-1" style={{ color: 'var(--c-amber)' }}>{place.region}</p>
                )}

                <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--c-muted)' }}>
                  {place.description || t.places.noDescription}
                </p>

                {place.bookingUrl && (
                  <a
                    href={place.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 inline-flex items-center gap-1 text-xs hover:underline"
                    style={{ color: 'var(--c-amber)' }}
                  >
                    <ExternalLink size={10} />
                    {t.places.bookingUrl}
                  </a>
                )}

                {place.tags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {place.tags.slice(0, 3).map((tag, i) => (
                      <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); toggleTag(tag); }}
                        className="text-xs px-1.5 py-0.5 rounded transition-all"
                        style={{
                          background: filterTags.has(tag) ? 'var(--c-ink)' : 'var(--c-vellum)',
                          color: filterTags.has(tag) ? 'var(--c-vellum)' : 'var(--c-muted)',
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                    {place.tags.length > 3 && (
                      <span className="text-xs" style={{ color: 'var(--c-muted)' }}>+{place.tags.length - 3}</span>
                    )}
                  </div>
                )}
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
          onEdit={() => handleEdit(viewPlace)}
        />
      )}

      {editPlace !== null && (
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
