import { X, ExternalLink, Pencil, Hotel, MapPin, Utensils, Star, Calendar } from 'lucide-react';

const TYPE_ICONS = { hotel: Hotel, attraction: MapPin, restaurant: Utensils, other: Star };
const STATUS_COLORS = {
  booked: 'bg-green-100 text-green-700',
  considering: 'bg-yellow-100 text-yellow-700',
  visited: 'bg-blue-100 text-blue-700',
};

export default function PlaceDetailModal({ place, store, t, onClose, onEdit }) {
  const Icon = TYPE_ICONS[place.type] || Star;
  const usedInDays = store.days.filter((d) => d.accommodationId === place.id);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-blue-50 rounded-xl shrink-0">
              <Icon size={18} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-800 text-lg leading-tight">{place.name}</h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-gray-400">{t.places[place.type] || place.type}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    STATUS_COLORS[place.status] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {t.places[place.status] || place.status}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg shrink-0 ms-2">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Booking URL */}
          {place.bookingUrl && (
            <a
              href={place.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
            >
              <ExternalLink size={13} />
              {t.places.bookingUrl}
            </a>
          )}

          {/* Description */}
          {place.description && (
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{place.description}</p>
          )}

          {/* Tags */}
          {place.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {place.tags.map((tag, i) => (
                <span key={i} className="text-sm bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Notes */}
          {place.notes && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{place.notes}</p>
            </div>
          )}

          {/* Used in days */}
          {usedInDays.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Calendar size={11} />
                {t.places.usedInDays}
              </p>
              <div className="space-y-1">
                {usedInDays.map((d) => (
                  <div key={d.id} className="text-sm text-gray-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                    {d.date}
                    {d.region ? ` · ${d.region}` : ''}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {onEdit && (
          <div className="flex justify-end p-4 border-t border-gray-100">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Pencil size={13} />
              {t.edit.edit}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
