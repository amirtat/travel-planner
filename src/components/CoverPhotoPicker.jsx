import { useState, useEffect, useRef } from 'react';
import { X, Check, ChevronLeft, ChevronRight, ImageOff, Link, Upload } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { searchWikiImages } from '../wikiImages';

/** Resize image to max 1200px on longest side, returns a Blob (jpeg 85%) */
async function resizeImage(file, maxDim = 1200) {
  return new Promise((resolve) => {
    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(objUrl);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
    };
    img.src = objUrl;
  });
}

const TABS = ['wiki', 'url', 'upload'];

export default function CoverPhotoPicker({ trip, store, onClose }) {
  const [tab, setTab] = useState('wiki');
  const [images, setImages] = useState([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [uploadPreview, setUploadPreview] = useState(null); // { url, file }
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

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

  const wikiCurrent = images[idx];
  const urlCurrent = customUrl ? { url: customUrl } : null;
  const uploadCurrent = uploadPreview;

  const current = tab === 'wiki' ? wikiCurrent : tab === 'url' ? urlCurrent : uploadCurrent;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('קובץ גדול מדי (מקסימום 20MB)');
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setUploadPreview({ url: previewUrl, file });
  };

  const handleAccept = async () => {
    if (!current?.url) return;
    setSaving(true);
    try {
      if (tab === 'upload' && uploadPreview?.file) {
        const blob = await resizeImage(uploadPreview.file);
        const storageRef = ref(storage, `trip-covers/${trip.id}/${Date.now()}.jpg`);
        await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
        const downloadUrl = await getDownloadURL(storageRef);
        await store.setTripCover(trip.id, downloadUrl);
      } else {
        await store.setTripCover(trip.id, current.url);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setUploadError('שגיאה בהעלאה — נסה שוב');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    await store.setTripCover(trip.id, null);
    setSaving(false);
    onClose();
  };

  const tabStyle = (key) => ({
    color: tab === key ? 'var(--c-amber)' : 'var(--c-muted)',
    borderBottom: tab === key ? '2px solid var(--c-amber)' : '2px solid transparent',
  });

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
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'var(--c-muted)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <button onClick={() => setTab('wiki')} className="flex-1 py-2 text-xs font-medium transition-colors" style={tabStyle('wiki')}>
            ויקיפדיה ({loading ? '…' : images.length})
          </button>
          <button onClick={() => setTab('url')} className="flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 transition-colors" style={tabStyle('url')}>
            <Link size={11} /> קישור
          </button>
          <button onClick={() => setTab('upload')} className="flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 transition-colors" style={tabStyle('upload')}>
            <Upload size={11} /> העלאה
          </button>
        </div>

        {/* Image area */}
        <div className="relative bg-black" style={{ height: 200 }}>
          {tab === 'upload' ? (
            uploadPreview ? (
              <img src={uploadPreview.url} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <button
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 w-full transition-colors"
                style={{ background: 'var(--c-vellum)', color: 'var(--c-muted)' }}
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-amber-light)'; e.currentTarget.style.color = 'var(--c-amber)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--c-vellum)'; e.currentTarget.style.color = 'var(--c-muted)'; }}
              >
                <Upload size={32} />
                <span className="text-sm font-medium">לחץ לבחירת קובץ</span>
                <span className="text-xs opacity-70">JPG, PNG, WEBP — עד 20MB</span>
              </button>
            )
          ) : tab === 'url' ? (
            customUrl ? (
              <img key={customUrl} src={customUrl} alt="preview" className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ color: 'var(--c-muted)', background: 'var(--c-vellum)' }}>
                <Link size={24} />
                <span className="text-xs">הדבק קישור לתמונה למטה</span>
              </div>
            )
          ) : loading ? (
            <div className="absolute inset-0 flex items-center justify-center" style={{ color: 'var(--c-muted)', background: 'var(--c-vellum)' }}>
              <span className="text-sm animate-pulse">מחפש תמונות…</span>
            </div>
          ) : !wikiCurrent ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ color: 'var(--c-muted)', background: 'var(--c-vellum)' }}>
              <ImageOff size={28} /><span className="text-sm">לא נמצאו תמונות</span>
            </div>
          ) : (
            <>
              <img key={wikiCurrent.url} src={wikiCurrent.url} alt={wikiCurrent.title} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 inset-x-0 px-3 py-2" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }}>
                <p className="text-white text-xs truncate">{wikiCurrent.title}</p>
                <p className="text-white/50 text-[10px]">{idx + 1} / {images.length}</p>
              </div>
              {idx > 0 && (
                <button onClick={() => setIdx((i) => i - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:opacity-80" style={{ background: 'rgba(0,0,0,0.55)', color: 'white' }}>
                  <ChevronLeft size={18} />
                </button>
              )}
              {idx < images.length - 1 && (
                <button onClick={() => setIdx((i) => i + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:opacity-80" style={{ background: 'rgba(0,0,0,0.55)', color: 'white' }}>
                  <ChevronRight size={18} />
                </button>
              )}
            </>
          )}
        </div>

        {/* URL input */}
        {tab === 'url' && (
          <div className="px-4 pt-3">
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              dir="ltr"
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ background: 'var(--c-vellum)', border: '1px solid var(--c-border)', color: 'var(--c-ink)', '--tw-ring-color': 'var(--c-amber)' }}
            />
          </div>
        )}

        {/* Upload change button */}
        {tab === 'upload' && uploadPreview && (
          <div className="px-4 pt-3">
            <button onClick={() => fileInputRef.current?.click()} className="text-xs transition-colors" style={{ color: 'var(--c-muted)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--c-ink)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--c-muted)'}>
              בחר קובץ אחר
            </button>
          </div>
        )}

        {uploadError && (
          <p className="px-4 pt-2 text-xs" style={{ color: '#dc2626' }}>{uploadError}</p>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Actions */}
        <div className="flex items-center gap-2 p-4">
          {trip.coverPhotoUrl ? (
            <button onClick={handleRemove} disabled={saving} className="text-sm px-3 py-2 rounded-lg disabled:opacity-40 transition-colors"
              style={{ background: 'var(--c-vellum)', color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}>
              הסר תמונה
            </button>
          ) : (
            <button onClick={onClose} className="text-sm px-3 py-2 rounded-lg transition-colors"
              style={{ background: 'var(--c-vellum)', color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}>
              ביטול
            </button>
          )}
          <button
            onClick={handleAccept}
            disabled={!current?.url || saving}
            className="flex-1 flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-lg hover:opacity-80 disabled:opacity-40 transition-opacity"
            style={{ background: 'var(--c-ink)', color: 'var(--c-vellum)' }}
          >
            {saving ? <span className="animate-pulse">מעלה…</span> : <><Check size={14} /> בחר תמונה</>}
          </button>
        </div>
      </div>
    </div>
  );
}
