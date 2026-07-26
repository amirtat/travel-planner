import { useState, useRef } from 'react';
import { X, Plus, Trash2, GripVertical, MapPin } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function uid() { return Math.random().toString(36).slice(2); }

function SortableItem({ item, places, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item._uid });
  const place = item.type === 'place' ? places.find((p) => p.id === item.id) : null;
  const label = item.type === 'place' ? (place?.name ?? '?') : item.value;
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 bg-white border rounded-lg px-2 py-1.5 text-sm ${
        isDragging ? 'shadow-lg border-indigo-300 opacity-80' : 'border-gray-200'
      }`}
    >
      <span {...attributes} {...listeners} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none">
        <GripVertical size={14} />
      </span>
      <MapPin size={11} className={item.type === 'place' ? 'text-indigo-400 shrink-0' : 'text-gray-300 shrink-0'} />
      <span className="flex-1 text-gray-700 text-xs truncate">{label}</span>
      <button onClick={() => onRemove(item._uid)} className="text-gray-300 hover:text-red-400 transition-colors">
        <X size={12} />
      </button>
    </div>
  );
}

export default function DayEditModal({ day, store, t, onClose }) {
  const isNew = !day;
  const [form, setForm] = useState({
    date: day?.date ?? '',
    accommodationId: day?.accommodationId ?? '',
    accommodationName: day?.accommodationName ?? '',
    region: day?.region ?? '',
    freeCancellation: day?.freeCancellation ?? '',
    items: (day?.items ?? []).map((item) => ({ ...item, _uid: uid() })),
    notes: day?.notes ?? '',
  });
  const [itemInput, setItemInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const blurTimeout = useRef(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const hotels = store.places.filter((p) => p.type === 'hotel');

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // Places not already added as items
  const placeSuggestions = store.places.filter(
    (p) =>
      itemInput.trim() &&
      p.name.toLowerCase().includes(itemInput.toLowerCase()) &&
      !form.items.some((i) => i.type === 'place' && i.id === p.id)
  );

  const addPlaceItem = (place) => {
    set('items', [...form.items, { type: 'place', id: place.id, _uid: uid() }]);
    setItemInput('');
    setShowSuggestions(false);
  };

  const addTextItem = (text) => {
    const v = (text ?? itemInput).trim();
    if (!v) return;
    set('items', [...form.items, { type: 'text', value: v, _uid: uid() }]);
    setItemInput('');
    setShowSuggestions(false);
  };

  const removeItem = (itemUid) =>
    set('items', form.items.filter((i) => i._uid !== itemUid));

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
    const cleanItems = form.items.map(({ _uid, ...rest }) => rest);
    const formData = { ...form, items: cleanItems };
    isNew ? store.addDay(formData) : store.updateDay(day.id, formData);
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

          {/* Items — unified places + free text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              מקומות לביקור ביום זה
            </label>

            {/* Current items — draggable */}
            {form.items.length > 0 && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={({ active, over }) => {
                  if (over && active.id !== over.id) {
                    const oldIdx = form.items.findIndex((i) => i._uid === active.id);
                    const newIdx = form.items.findIndex((i) => i._uid === over.id);
                    set('items', arrayMove(form.items, oldIdx, newIdx));
                  }
                }}
              >
                <SortableContext items={form.items.map((i) => i._uid)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1 mb-2">
                    {form.items.map((item) => (
                      <SortableItem key={item._uid} item={item} places={store.places} onRemove={removeItem} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {/* Input with suggestions */}
            <div className="relative">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={itemInput}
                  onChange={(e) => { setItemInput(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => { blurTimeout.current = setTimeout(() => setShowSuggestions(false), 150); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addTextItem(); }
                    if (e.key === 'Escape') setShowSuggestions(false);
                  }}
                  placeholder="הוסף מקום או פעילות..."
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => addTextItem()}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              {showSuggestions && (placeSuggestions.length > 0 || itemInput.trim()) && (
                <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {placeSuggestions.map((place) => (
                    <li
                      key={place.id}
                      onMouseDown={(e) => { e.preventDefault(); clearTimeout(blurTimeout.current); addPlaceItem(place); }}
                      className="px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer flex items-center gap-2"
                    >
                      <MapPin size={12} className="text-indigo-400 shrink-0" />
                      {place.name}
                    </li>
                  ))}
                  {itemInput.trim() && (
                    <li
                      onMouseDown={(e) => { e.preventDefault(); clearTimeout(blurTimeout.current); addTextItem(itemInput.trim()); }}
                      className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 cursor-pointer flex items-center gap-2 border-t border-gray-100"
                    >
                      <Plus size={12} className="shrink-0" />
                      הוסף כטקסט: &ldquo;{itemInput.trim()}&rdquo;
                    </li>
                  )}
                </ul>
              )}
            </div>
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
