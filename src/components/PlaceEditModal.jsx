import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

export default function PlaceEditModal({ place, store, t, onClose }) {
  const isNew = !place;
  const [form, setForm] = useState({
    name: place?.name ?? '',
    type: place?.type ?? 'hotel',
    status: place?.status ?? 'considering',
    description: place?.description ?? '',
    bookingUrl: place?.bookingUrl ?? '',
    tags: place?.tags ?? [],
    notes: place?.notes ?? '',
  });
  const [tagInput, setTagInput] = useState('');

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

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
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-bold text-gray-800 text-lg">
            {isNew ? t.placeEdit.titleAdd : t.placeEdit.titleEdit}
          </h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.placeEdit.name} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder={t.placeEdit.namePlaceholder}
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.placeEdit.type}</label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="hotel">{t.places.hotel}</option>
                <option value="attraction">{t.places.attraction}</option>
                <option value="restaurant">{t.places.restaurant}</option>
                <option value="other">{t.places.other}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.placeEdit.status}</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="considering">{t.places.considering}</option>
                <option value="booked">{t.places.booked}</option>
                <option value="visited">{t.places.visited}</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.placeEdit.description}</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder={t.placeEdit.descriptionPlaceholder}
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Booking URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.placeEdit.bookingUrl}</label>
            <input
              type="url"
              value={form.bookingUrl}
              onChange={(e) => set('bookingUrl', e.target.value)}
              placeholder={t.placeEdit.bookingUrlPlaceholder}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.placeEdit.tags}</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder={t.placeEdit.tagsPlaceholder}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addTag}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 bg-gray-100 text-gray-700 text-sm px-2.5 py-1 rounded-full"
                  >
                    {tag}
                    <button onClick={() => removeTag(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.placeEdit.notes}</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder={t.placeEdit.notesPlaceholder}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

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
              disabled={!form.name.trim()}
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
