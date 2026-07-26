import { useState } from 'react';
import { Plus, ExternalLink, Hotel, MapPin, Utensils, Star } from 'lucide-react';
import PlaceDetailModal from './PlaceDetailModal';
import PlaceEditModal from './PlaceEditModal';

const TYPE_ICONS = { hotel: Hotel, attraction: MapPin, restaurant: Utensils, other: Star };
const STATUS_COLORS = {
  booked: 'bg-green-100 text-green-700',
  considering: 'bg-yellow-100 text-yellow-700',
  visited: 'bg-blue-100 text-blue-700',
};

export default function PlacesView({ store, t }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTags, setFilterTags] = useState(new Set());
  const [viewPlace, setViewPlace] = useState(null);
  const [editPlace, setEditPlace] = useState(null);

  const STATUSES = ['all', 'booked', 'considering', 'visited'];

  const allTags = [...new Set(store.places.flatMap((p) => p.tags ?? []))].sort();

  const toggleTag = (tag) => {
    setFilterTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const filtered = store.places.filter((p) => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterTags.size > 0 && !([...filterTags].some((tag) => p.tags?.includes(tag)))) return false;
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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUSES.map((s) => {
              const count = s === 'all' ? store.places.length : store.places.filter((p) => p.status === s).length;
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1 ${
                    filterStatus === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t.places[s] || s}
                  <span className={`text-xs ${filterStatus === s ? 'opacity-75' : 'text-gray-400'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setEditPlace('new')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
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
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                  filterTags.has(tag)
                    ? 'bg-gray-700 text-white border-gray-700'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700'
                }`}
              >
                {tag}
              </button>
            ))}
            {filterTags.size > 0 && (
              <button
                onClick={() => setFilterTags(new Set())}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors ms-1"
              >
                ✕ נקה
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      {store.places.length === 0 ? (
        <div className="text-center text-gray-400 py-20 bg-white rounded-xl border border-dashed border-gray-200 text-sm">
          {t.places.noPlaces}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-16 text-sm">
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
                className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gray-100 group-hover:bg-blue-50 rounded-lg transition-colors">
                      <Icon size={14} className="text-gray-500 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <span className="text-xs text-gray-400">{t.places[place.type] || place.type}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      STATUS_COLORS[place.status] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {t.places[place.status] || place.status}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2 text-sm">{place.name}</h3>

                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                  {place.description || t.places.noDescription}
                </p>

                {place.bookingUrl && (
                  <a
                    href={place.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
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
                        className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
                          filterTags.has(tag)
                            ? 'bg-gray-700 text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                    {place.tags.length > 3 && (
                      <span className="text-xs text-gray-400">+{place.tags.length - 3}</span>
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
