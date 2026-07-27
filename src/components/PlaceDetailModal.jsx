import { X, ExternalLink, Pencil, Hotel, MapPin, Utensils, Star, Calendar, Clock, Navigation } from 'lucide-react';

const TYPE_ICONS = { hotel: Hotel, attraction: MapPin, restaurant: Utensils, other: Star };
const STATUS_STYLES = {
  booked:      { background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac' },
  considering: { background: 'var(--c-amber-light)', color: 'var(--c-amber)', border: '1px solid var(--c-amber-mid)' },
  visited:     { background: 'var(--c-vellum)', color: 'var(--c-muted)', border: '1px solid var(--c-border)' },
};

export default function PlaceDetailModal({ place, store, t, onClose, onEdit }) {
  const Icon = TYPE_ICONS[place.type] || Star;
  const usedInDays = store.days.filter((d) => d.accommodationId === place.id);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 sticky top-0 rounded-t-2xl" style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-xl shrink-0" style={{ background: 'var(--c-amber-light)' }}>
              <Icon size={18} style={{ color: 'var(--c-amber)' }} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-lg leading-tight" style={{ color: 'var(--c-ink)' }}>{place.name}</h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{t.places[place.type] || place.type}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={STATUS_STYLES[place.status] ?? { background: 'var(--c-vellum)', color: 'var(--c-muted)' }}
                >
                  {t.places[place.status] || place.status}
                </span>
                {place.region && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--c-muted)' }}>
                    <Navigation size={10} />
                    {place.region}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg shrink-0 ms-2 transition-colors"
            style={{ color: 'var(--c-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--c-ink)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--c-muted)'}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Free Cancellation */}
          {place.freeCancellation && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--c-muted)' }}>
              <Clock size={13} className="shrink-0" />
              <span>{t.placeEdit.freeCancellation}: <span className="font-medium" style={{ color: 'var(--c-ink)' }}>{place.freeCancellation}</span></span>
            </div>
          )}

          {/* Booking URL */}
          {place.bookingUrl && (
            <a
              href={place.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:underline"
              style={{ color: 'var(--c-amber)' }}
            >
              <ExternalLink size={13} />
              {t.places.bookingUrl}
            </a>
          )}

          {/* Description */}
          {place.description && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--c-ink)' }}>
              {place.description}
            </p>
          )}

          {/* Tags */}
          {place.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {place.tags.map((tag, i) => (
                <span
                  key={i}
                  className="text-sm px-2.5 py-0.5 rounded-full"
                  style={{ background: 'var(--c-vellum)', color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Notes */}
          {place.notes && (
            <div className="rounded-xl p-3" style={{ background: 'var(--c-vellum)' }}>
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--c-ink)' }}>{place.notes}</p>
            </div>
          )}

          {/* Used in days */}
          {usedInDays.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1" style={{ color: 'var(--c-muted)' }}>
                <Calendar size={11} />
                {t.places.usedInDays}
              </p>
              <div className="space-y-1">
                {usedInDays.map((d) => (
                  <div
                    key={d.id}
                    className="text-sm px-3 py-1.5 rounded-lg"
                    style={{ background: 'var(--c-amber-light)', color: 'var(--c-ink)', border: '1px solid var(--c-amber-mid)' }}
                  >
                    {d.date}{d.region ? ` · ${d.region}` : ''}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {onEdit && (
          <div className="flex justify-end p-4" style={{ borderTop: '1px solid var(--c-border)' }}>
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors"
              style={{ background: 'var(--c-vellum)', color: 'var(--c-ink)', border: '1px solid var(--c-border)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-ink)'; e.currentTarget.style.color = 'var(--c-vellum)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--c-vellum)'; e.currentTarget.style.color = 'var(--c-ink)'; }}
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
