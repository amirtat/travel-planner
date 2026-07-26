import { useState, useRef } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

export default function DayEditModal({ day, store, t, onClose }) {
  const isNew = !day;
  const [form, setForm] = useState({
    date: day?.date ?? '',
    activities: day?.activities ?? [],
    accommodationId: day?.accommodationId ?? '',
    accommodationName: day?.accommodationName ?? '',
    region: day?.region ?? '',
    freeCancellation: day?.freeCancellation ?? '',
    notes: day?.notes ?? '',
  });
  const [actInput, setActInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const blurTimeout = useRef(null);

  const hotels = store.places.filter((p) => p.type === 'hotel');

  const placeSuggestions = store.places
    .map((p) => p.name)
    .filter(
      (name) =>
        actInput.trim() &&
        name.toLowerCase().includes(actInput.toLowerCase()) &&
        !form.activities.includes(name)
    );

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const addActivity = (value) => {
    const v = (value ?? actInput).trim();
    if (!v || form.activities.includes(v)) return;
    set('activities', [...form.activities, v]);
    setActInput('');
    setShowSuggestions(false);
  };

  const removeActivity = (i) =>
    set('activities', form.activities.filter((_, j) => j !== i));

  const handleAccommodationSelect = (e) => {
    const id = e.target.value;
    const place = store.places.find((p) => p.id === id);
    setForm((f) => ({
      ...f,
      accommodationId: id,
      accommodationName: place?.name ?? '',
    }));
  };

  const clearAccommodation = () => setForm((f) => ({ ...f, accommodationId: '', accommodationName: '' }));

  const handleSave = () => {
    if (!form.date) return;
    isNew ? store.addDay(form) : store.updateDay(day.id, form);
    onClose();
  };

  const handleDelete = () => {
    if (confirm(t.edit.confirmDelete)) {
      store.deleteDay(day.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-bold text-gray-800 text-lg">
            {isNew ? t.dayEdit.titleAdd : t.dayEdit.titleEdit}
          </h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.dayEdit.date} <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.dayEdit.region}</label>
            <input
              type="text"
              value={form.region}
              onChange={(e) => set('region', e.target.value)}
              placeholder={t.dayEdit.regionPlaceholder}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Activities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.dayEdit.activities}</label>
            <div className="relative mb-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={actInput}
                  onChange={(e) => { setActInput(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => { blurTimeout.current = setTimeout(() => setShowSuggestions(false), 150); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addActivity(); }
                    if (e.key === 'Escape') setShowSuggestions(false);
                  }}
                  placeholder={t.dayEdit.addActivity}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => addActivity()}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              {showSuggestions && placeSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                  {placeSuggestions.map((name, i) => (
                    <li
                      key={i}
                      onMouseDown={(e) => { e.preventDefault(); clearTimeout(blurTimeout.current); addActivity(name); }}
                      className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {form.activities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.activities.map((act, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 bg-blue-50 text-blue-700 text-sm px-2.5 py-1 rounded-full"
                  >
                    {act}
                    <button onClick={() => removeActivity(i)} className="text-blue-400 hover:text-red-500 transition-colors">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Accommodation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.dayEdit.accommodation}</label>
            {hotels.length > 0 && (
              <select
                value={form.accommodationId}
                onChange={handleAccommodationSelect}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              >
                <option value="">{t.dayEdit.selectPlace}</option>
                {hotels.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
            {!form.accommodationId && (
              <input
                type="text"
                value={form.accommodationName}
                onChange={(e) => set('accommodationName', e.target.value)}
                placeholder={t.dayEdit.accommodationFree}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            {form.accommodationId && (
              <button
                onClick={clearAccommodation}
                className="mt-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                ✕ {t.edit.cancel}
              </button>
            )}
          </div>

          {/* Free Cancellation — only when no linked hotel (hotel has its own field) */}
          {!form.accommodationId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.dayEdit.freeCancellation}
              </label>
              <input
                type="date"
                value={form.freeCancellation}
                onChange={(e) => set('freeCancellation', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.dayEdit.notes}</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder={t.dayEdit.notesPlaceholder}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
          <div>
            {!isNew && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-sm transition-colors"
              >
                <Trash2 size={14} />
                {t.edit.delete}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {t.edit.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={!form.date}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t.edit.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
