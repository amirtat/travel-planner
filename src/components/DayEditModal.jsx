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

const inputStyle = {
  background: 'var(--c-vellum)',
  border: '1px solid var(--c-border)',
  color: 'var(--c-ink)',
  '--tw-ring-color': 'var(--c-amber)',
};

const labelClass = 'block text-xs font-semibold uppercase tracking-wide mb-1.5';

function SortableItem({ item, places, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item._uid });
  const place = item.type === 'place' ? places.find((p) => p.id === item.id) : null;
  const label = item.type === 'place' ? (place?.name ?? '?') : item.value;
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        background: isDragging ? 'var(--c-amber-light)' : 'var(--c-vellum)',
        border: `1px solid ${isDragging ? 'var(--c-amber-mid)' : 'var(--c-border)'}`,
      }}
      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
        style={{ color: 'var(--c-border)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--c-muted)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--c-border)'}
      >
        <GripVertical size={14} />
      </span>
      <MapPin size={11} style={{ color: item.type === 'place' ? 'var(--c-amber)' : 'var(--c-border)', flexShrink: 0 }} />
      <span className="flex-1 text-xs truncate" style={{ color: 'var(--c-ink)' }}>{label}</span>
      <button
        onClick={() => onRemove(item._uid)}
        className="transition-colors"
        style={{ color: 'var(--c-border)' }}
        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--c-border)'}
      >
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
      ...(place?.region ? { region: place.region } : {}),
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
            {isNew ? t.dayEdit.titleAdd : t.dayEdit.titleEdit}
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
          {/* Date */}
          <div>
            <label className={labelClass} style={{ color: 'var(--c-muted)' }}>
              {t.dayEdit.date} <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>

          {/* Region */}
          <div>
            <label className={labelClass} style={{ color: 'var(--c-muted)' }}>{t.dayEdit.region}</label>
            <input
              type="text"
              value={form.region}
              onChange={(e) => set('region', e.target.value)}
              placeholder={t.dayEdit.regionPlaceholder}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>

          {/* Items */}
          <div>
            <label className={labelClass} style={{ color: 'var(--c-muted)' }}>
              {store.language === 'he' ? 'מקומות לביקור ביום זה' : 'Places to visit this day'}
            </label>

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
                  placeholder={store.language === 'he' ? 'הוסף מקום או פעילות...' : 'Add place or activity...'}
                  className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={inputStyle}
                />
                <button
                  onClick={() => addTextItem()}
                  className="p-2 rounded-lg transition-opacity hover:opacity-80"
                  style={{ background: 'var(--c-ink)', color: 'var(--c-vellum)' }}
                >
                  <Plus size={16} />
                </button>
              </div>
              {showSuggestions && (placeSuggestions.length > 0 || itemInput.trim()) && (
                <ul
                  className="absolute z-10 w-full rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto"
                  style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
                >
                  {placeSuggestions.map((place) => (
                    <li
                      key={place.id}
                      onMouseDown={(e) => { e.preventDefault(); clearTimeout(blurTimeout.current); addPlaceItem(place); }}
                      className="px-3 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors"
                      style={{ color: 'var(--c-ink)', borderBottom: '1px solid var(--c-border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--c-amber-light)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <MapPin size={12} style={{ color: 'var(--c-amber)', flexShrink: 0 }} />
                      {place.name}
                    </li>
                  ))}
                  {itemInput.trim() && (
                    <li
                      onMouseDown={(e) => { e.preventDefault(); clearTimeout(blurTimeout.current); addTextItem(itemInput.trim()); }}
                      className="px-3 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors"
                      style={{ color: 'var(--c-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--c-vellum)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <Plus size={12} style={{ flexShrink: 0 }} />
                      {store.language === 'he' ? `הוסף כטקסט: "${itemInput.trim()}"` : `Add as text: "${itemInput.trim()}"`}
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>

          {/* Accommodation */}
          <div>
            <label className={labelClass} style={{ color: 'var(--c-muted)' }}>{t.dayEdit.accommodation}</label>
            {hotels.length > 0 && (
              <select
                value={form.accommodationId}
                onChange={handleAccommodationSelect}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 mb-2"
                style={inputStyle}
              >
                <option value="">{t.dayEdit.selectPlace}</option>
                {hotels.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
            {!form.accommodationId && (
              <input
                type="text"
                value={form.accommodationName}
                onChange={(e) => set('accommodationName', e.target.value)}
                placeholder={t.dayEdit.accommodationFree}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={inputStyle}
              />
            )}
            {form.accommodationId && (
              <button
                onClick={clearAccommodation}
                className="mt-1 text-xs transition-colors"
                style={{ color: 'var(--c-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--c-muted)'}
              >
                ✕ {t.edit.cancel}
              </button>
            )}
          </div>

          {/* Free Cancellation — only when no linked hotel */}
          {!form.accommodationId && (
            <div>
              <label className={labelClass} style={{ color: 'var(--c-muted)' }}>
                {t.dayEdit.freeCancellation}
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

          {/* Notes */}
          <div>
            <label className={labelClass} style={{ color: 'var(--c-muted)' }}>{t.dayEdit.notes}</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder={t.dayEdit.notesPlaceholder}
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
              disabled={!form.date}
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
