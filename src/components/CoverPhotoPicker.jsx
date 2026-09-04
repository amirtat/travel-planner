import { useState, useEffect } from 'react';
import { X, Check, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { searchWikiImages } from '../wikiImages';

export default function CoverPhotoPicker({ trip, store, onClose }) {
  const [images, setImages] = useState([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    searchWikiImages(trip.name).then((imgs) => {
      setImages(imgs);
      // If trip already has a cover, start there
      if (trip.coverPhotoUrl) {
        const cur = imgs.findIndex((i) => i.url === trip.coverPhotoUrl);
        if (cur >= 0) setIdx(cur);
      }
      setLoading(false);
    });
  }, [trip.id]);

  const current = images[idx];

  const handleAccept = async () => {
    if (!current) return;
    setSaving(true);
    await store.setTripCover(trip.id, current.url);
    setSaving(false);
    onClose();
  };

  const handleRemove = async () => {
    setSaving(true);
    await store.setTripCover(trip.id, null);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="rounded-2xl w-full max-w-sm overflow-hidden shadow-xl"
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--c-ink)' }}>תמונת כיסוי</p>
            <p className="text-xs" style={{ color: 'var(--c-muted)' }}>{trip.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--c-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--c-ink)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--c-muted)'}
          >
            <X size={16} />
          </button>
        </div>

        {/* Image */}
        <div className="relative bg-black" style={{ height: 220 }}>
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm" style={{ color: 'var(--c-muted)', background: 'var(--c-vellum)' }}>
              <span className="animate-pulse">מחפש תמונות...</span>
            </div>
          ) : !current ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ color: 'var(--c-muted)', background: 'var(--c-vellum)' }}>
              <ImageOff size={28} />
              <span className="text-sm">לא נמצאו תמונות</span>
            </div>
          ) : (
            <>
              <img
                key={current.url}
                src={current.url}
                alt={current.title}
                className="w-full h-full object-cover"
              />
              {/* Overlay with title + counter */}
              <div
                className="absolute bottom-0 inset-x-0 px-3 py-2"
                style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }}
              >
                <p className="text-white text-xs truncate">{current.title}</p>
                <p className="text-white/50 text-[10px]">{idx + 1} / {images.length}</p>
              </div>
              {/* Prev */}
              {idx > 0 && (
                <button
                  onClick={() => setIdx((i) => i - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-opacity hover:opacity-80"
                  style={{ background: 'rgba(0,0,0,0.55)', color: 'white' }}
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              {/* Next */}
              {idx < images.length - 1 && (
                <button
                  onClick={() => setIdx((i) => i + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-opacity hover:opacity-80"
                  style={{ background: 'rgba(0,0,0,0.55)', color: 'white' }}
                >
                  <ChevronRight size={18} />
                </button>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 p-4">
          {trip.coverPhotoUrl && (
            <button
              onClick={handleRemove}
              disabled={saving}
              className="text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
              style={{ background: 'var(--c-vellum)', color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}
            >
              הסר
            </button>
          )}
          <button
            onClick={handleAccept}
            disabled={!current || saving}
            className="flex-1 flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: 'var(--c-ink)', color: 'var(--c-vellum)' }}
          >
            <Check size={14} />
            {saving ? 'שומר...' : 'בחר תמונה זו'}
          </button>
        </div>
      </div>
    </div>
  );
}
