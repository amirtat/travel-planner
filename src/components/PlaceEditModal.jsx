import { useState } from 'react';
import { X, Plus, Trash2, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { photonSearch, parseGoogleMapsUrl } from '../routeApi';

const inputStyle = {
  background: 'var(--c-vellum)',
  border: '1px solid var(--c-border)',
  color: 'var(--c-ink)',
  '--tw-ring-color': 'var(--c-amber)',
};

const labelClass = 'block text-xs font-semibold uppercase tracking-wide mb-1.5';

export default function PlaceEditModal({ place, store, t, onClose }) {
  const isNew = !place;
  const existingRegions = [...new Set(store.places.map((p) => p.region).filter(Boolean))].sort();

  const [form, setForm] = useState({
    name: place?.name ?? '',
    type: place?.type ?? 'hotel',
    status: place?.status ?? 'considering',
    region: place?.region ?? '',
    description: place?.description ?? '',
    bookingUrl: place?.bookingUrl ?? '',
    freeCancellation: place?.freeCancellation ?? '',
    address: place?.address ?? '',
    lat: place?.lat ?? null,
    lon: place?.lon ?? null,
    tags: place?.tags ?? [],
    notes: place?.notes ?? '',
  });
  const [tagInput, setTagInput] = useState('');
  const [geoResults, setGeoResults] = useState([]);
  const [geoStatus, setGeoStatus] = useState('idle'); // idle | searching | done | error

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleAddressChange = (e) => {
    const val = e.target.value;
    const gmCoords = parseGoogleMapsUrl(val);
    if (gmCoords) {
      const address = gmCoords.name || val;
      setForm((f) => ({ ...f, address, lat: gmCoords.lat, lon: gmCoords.lon }));
      setGeoStatus('idle');
      setGeoResults([]);
    } else {
      setForm((f) => ({ ...f, address: val, lat: null, lon: null }));
      setGeoResults([]);
      setGeoStatus('idle');
    }
  };

  const handleGeoSearch = async () => {
    const q = form.address.trim();
    if (!q) return;
    const gmCoords = parseGoogleMapsUrl(q);
    if (gmCoords) {
      const address = gmCoords.name || q;
      setForm((f) => ({ ...f, address, lat: gmCoords.lat, lon: gmCoords.lon }));
      setGeoStatus('idle');
      return;
    }
    setGeoStatus('searching');
    setGeoResults([]);
    try {
      const results = await photonSearch(q, 5);
      setGeoResults(results);
      setGeoStatus(results.length ? 'done' : 'error');
    } catch {
      setGeoStatus('error');
    }
  };

  const applyGeoResult = (r) => {
    setForm((f) => ({ ...f, address: r.displayName, lat: r.lat, lon: r.lon }));
    setGeoResults([]);
    setGeoStatus('idle');
  };

  const addTag = () => {
    const v = tagInput.trim();
    if (!v || form.tags.includes(v)) return;
    set('tags', [...form.tags, v]);
    setTagInput('');
  };

  const removeTag = (i) => set('tags', form.tags.filter((_, j) => j !== i));

  const handleSave = () => {
    if (!form.name.trim()) return;
    isNew ? store.addPlace(form) : store.updatePlace(place.id, form);
    onClose();
  };

  const handleDelete = () => {
    if (confirm(t.edit.confirmDelete)) {
      store.deletePlace(place.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 sticky top-0 rounded-t-2xl"
          style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}
        >
          <h3 className="font-bold text-lg" style={{ color: 'var(--c-ink)' }}>
            {isNew ? t.placeEdit.titleAdd : t.placeEdit.titleEdit}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--c-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--c-ink)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--c-muted)'}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className={labelClass} style={{ color: 'var(--c-muted)' }}>
              {t.placeEdit.name} <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder={t.placeEdit.namePlaceholder}
              autoFocus
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>

          {/* Type + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} style={{ color: 'var(--c-muted)' }}>{t.placeEdit.type}</label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={inputStyle}
              >
                <option value="hotel">{t.places.hotel}</option>
                <option value="attraction">{t.places.attraction}</option>
                <option value="restaurant">{t.places.restaurant}</option>
                <option value="other">{t.places.other}</option>
              </select>
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--c-muted)' }}>{t.placeEdit.status}</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={inputStyle}
              >
                <option value="considering">{t.places.considering}</option>
                <option value="booked">{t.places.booked}</option>
                <option value="visited">{t.places.visited}</option>
                <option value="abandoned">{t.places.abandoned}</option>
              </select>
            </div>
          </div>

          {/* Region */}
          <div>
            <label className={labelClass} style={{ color: 'var(--c-muted)' }}>{t.placeEdit.region}</label>
            <input
              type="text"
              list="region-suggestions"
              value={form.region}
              onChange={(e) => set('region', e.target.value)}
              placeholder={t.placeEdit.regionPlaceholder}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={inputStyle}
            />
            {existingRegions.length > 0 && (
              <datalist id="region-suggestions">
                {existingRegions.map((r) => <option key={r} value={r} />)}
              </datalist>
            )}
          </div>

          {/* Description */}
          <div>
            <label className={labelClass} style={{ color: 'var(--c-muted)' }}>{t.placeEdit.description}</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder={t.placeEdit.descriptionPlaceholder}
              rows={4}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none"
              style={inputStyle}
            />
          </div>

          {/* Booking URL */}
          <div>
            <label className={labelClass} style={{ color: 'var(--c-muted)' }}>{t.placeEdit.bookingUrl}</label>
            <input
              type="url"
              value={form.bookingUrl}
              onChange={(e) => set('bookingUrl', e.target.value)}
              placeholder={t.placeEdit.bookingUrlPlaceholder}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>

          {/* Address / Location geocoding */}
          <div>
            <label className={labelClass} style={{ color: 'var(--c-muted)' }}>
              {t.placeEdit.address}
              {form.lat && (
                <span className="ms-2 inline-flex items-center gap-1 font-normal normal-case tracking-normal" style={{ color: '#16a34a' }}>
                  <CheckCircle2 size={11} />
                  {t.placeEdit.geocoded}
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.address}
                onChange={handleAddressChange}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleGeoSearch())}
                placeholder={t.placeEdit.addressPlaceholder}
                className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{
                  ...inputStyle,
                  ...(form.lat ? { background: '#f0fdf4', border: '1px solid #86efac' } : {}),
                }}
              />
              <button
                onClick={handleGeoSearch}
                disabled={geoStatus === 'searching' || !form.address.trim()}
                className="p-2 rounded-lg transition-colors disabled:opacity-40"
                style={{ background: 'var(--c-vellum)', color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-ink)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)'; }}
                title={t.placeEdit.geocodeBtn}
              >
                {geoStatus === 'searching'
                  ? <span className="animate-spin inline-block text-xs">⟳</span>
                  : <Search size={15} />
                }
              </button>
            </div>
            {geoStatus === 'error' && geoResults.length === 0 && (
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444' }}>
                <AlertCircle size={11} /> {t.placeEdit.geocodeError}
              </p>
            )}
            {geoResults.length > 0 && (
              <div
                className="mt-1 rounded-xl overflow-hidden shadow-sm"
                style={{ border: '1px solid var(--c-border)' }}
              >
                {geoResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => applyGeoResult(r)}
                    className="w-full text-start px-3 py-2 text-xs transition-colors"
                    style={{ color: 'var(--c-ink)', borderBottom: i < geoResults.length - 1 ? '1px solid var(--c-border)' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--c-amber-light)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    {r.displayName}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Free Cancellation — hotels only */}
          {form.type === 'hotel' && (
            <div>
              <label className={labelClass} style={{ color: 'var(--c-muted)' }}>
                {t.placeEdit.freeCancellation}
              </label>
              <input
                type="date"
                value={form.freeCancellation}
                onChange={(e) => set('freeCancellation', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={inputStyle}
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <label className={labelClass} style={{ color: 'var(--c-muted)' }}>{t.placeEdit.tags}</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder={t.placeEdit.tagsPlaceholder}
                className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={inputStyle}
              />
              <button
                onClick={addTag}
                className="p-2 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: 'var(--c-ink)', color: 'var(--c-vellum)' }}
              >
                <Plus size={16} />
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 text-sm px-2.5 py-1 rounded-full"
                    style={{ background: 'var(--c-vellum)', color: 'var(--c-ink)', border: '1px solid var(--c-border)' }}
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(i)}
                      className="transition-colors"
                      style={{ color: 'var(--c-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--c-muted)'}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass} style={{ color: 'var(--c-muted)' }}>{t.placeEdit.notes}</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder={t.placeEdit.notesPlaceholder}
              rows={3}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between p-4 sticky bottom-0 rounded-b-2xl"
          style={{ background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)' }}
        >
          <div>
            {!isNew && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-sm transition-colors"
                style={{ color: '#ef4444' }}
                onMouseEnter={e => e.currentTarget.style.color = '#b91c1c'}
                onMouseLeave={e => e.currentTarget.style.color = '#ef4444'}
              >
                <Trash2 size={14} />
                {t.edit.delete}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg transition-colors"
              style={{ background: 'var(--c-vellum)', color: 'var(--c-ink)', border: '1px solid var(--c-border)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--c-border)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--c-vellum)'}
            >
              {t.edit.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="px-4 py-2 text-sm rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--c-ink)', color: 'var(--c-vellum)' }}
            >
              {t.edit.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
