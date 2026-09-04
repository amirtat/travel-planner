import { useState, useEffect } from 'react';
import { X, Check, ChevronLeft, ChevronRight, ImageOff, Link } from 'lucide-react';
import { searchWikiImages } from '../wikiImages';

export default function CoverPhotoPicker({ trip, store, onClose }) {
  const [images, setImages] = useState([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    setLoading(true);
    searchWikiImages(trip.name).then((imgs) => {
      setImages(imgs);
      if (trip.coverPhotoUrl) {
        const cur = imgs.findIndex((i) => i.url === trip.coverPhotoUrl);
        if (cur >= 0) setIdx(cur);
      }
      setLoading(false);
    });
  }, [trip.id]);

  const current = showCustom ? (customUrl ? { url: customUrl, title: 'תמונה מקישור' } : null) : images[idx];

  const handleAccept = async () => {
    if (!current?.url) return;
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

        {/* Mode toggle */}
        <div className="flex border-b" style={{ borderColor: 'var(--c-border)' }}>
          <button
            onClick={() => setShowCustom(false)}
            className="flex-1 py-2 text-xs font-medium transition-colors"
            style={{
              color: !showCustom ? 'var(--c-amber)' : 'var(--c-muted)',
              borderBottom: !showCustom ? '2px solid var(--c-amber)' : '2px solid transparent',
            }}
          >
            ויקיפדיה ({loading ? '...' : images.length})
          </button>
          <button
            onClick={() => setShowCustom(true)}
            className="flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
            style={{
              color: showCustom ? 'var(--c-amber)' : 'var(--c-muted)',
              borderBottom: showCustom ? '2px solid var(--c-amber)' : '2px solid transparent',
            }}
          >
            <Link size={11} /> קישור מותאם
          </button>
        </div>

        {/* Image area */}
        <div className="relative bg-black" style={{ height: 200 }}>
          {showCustom ? (
            customUrl ? (
              <img
                key={customUrl}
                src={customUrl}
                alt="תמונה מותאמת"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                style={{ color: 'var(--c-muted)', background: 'var(--c-vellum)' }}
              >
                <Link size={24} />
                <span className="text-xs">הדבק קישור לתמונה למטה</span>
              </div>
            )
          ) : loading ? (
            <div className="absolute inset-0 flex items-center justify-center" style={{ color: 'var(--c-muted)', background: 'var(--c-vellum)' }}>
              <span className="text-sm animate-pulse">מחפש תמונות...</span>
            </div>
          ) : !current ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ color: 'var(--c-muted)', background: 'var(--c-vellum)' }}>
              <ImageOff size={28} />
              <span className="text-sm">לא נמצאו תמונות</span>
            </div>
          ) : (
            <>
              <img key={current.url} src={current.url} alt={current.title} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 inset-x-0 px-3 py-2" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }}>
                <p className="text-white text-xs truncate">{current.title}</p>
                <p className="text-white/50 text-[10px]">{idx + 1} / {images.length}</p>
              </div>
              {idx > 0 && (
                <button
                  onClick={() => setIdx((i) => i - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:opacity-80"
                  style={{ background: 'rgba(0,0,0,0.55)', color: 'white' }}
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              {idx < images.length - 1 && (
                <button
                  onClick={() => setIdx((i) => i + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:opacity-80"
                  style={{ background: 'rgba(0,0,0,0.55)', color: 'white' }}
                >
                  <ChevronRight size={18} />
                </button>
              )}
            </>
          )}
        </div>

        {/* Custom URL input */}
        {showCustom && (
          <div className="px-4 pt-3">
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              dir="ltr"
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{
                background: 'var(--c-vellum)',
                border: '1px solid var(--c-border)',
                color: 'var(--c-ink)',
                '--tw-ring-color': 'var(--c-amber)',
              }}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 p-4">
          {trip.coverPhotoUrl ? (
            <button
              onClick={handleRemove}
              disabled={saving}
              className="text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
              style={{ background: 'var(--c-vellum)', color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}
            >
              הסר תמונה
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-sm px-3 py-2 rounded-lg transition-colors"
              style={{ background: 'var(--c-vellum)', color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}
            >
              ביטול
            </button>
          )}
          <button
            onClick={handleAccept}
            disabled={!current?.url || saving}
            className="flex-1 flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: 'var(--c-ink)', color: 'var(--c-vellum)' }}
          >
            <Check size={14} />
            {saving ? 'שומר...' : 'בחר תמונה'}
          </button>
        </div>
      </div>
    </div>
  );
}
