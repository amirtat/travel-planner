import { useState, useRef } from 'react';
import { X, Download, Upload } from 'lucide-react';

const DEFAULT_TRAVEL_GREEN  = 30;
const DEFAULT_TRAVEL_YELLOW = 60;
const DEFAULT_CANCEL_URGENT = 3;
const DEFAULT_CANCEL_SOON   = 7;

const inputStyle = {
  background: 'var(--c-vellum)',
  border: '1px solid var(--c-border)',
  color: 'var(--c-ink)',
  '--tw-ring-color': 'var(--c-amber)',
};

export default function SettingsModal({ store, t, onClose }) {
  const [tripName, setTripName] = useState(store.tripName || '');
  const [travelGreen,   setTravelGreen]   = useState(store.travelGreenMax  ?? DEFAULT_TRAVEL_GREEN);
  const [travelYellow,  setTravelYellow]  = useState(store.travelYellowMax ?? DEFAULT_TRAVEL_YELLOW);
  const [cancelUrgent,  setCancelUrgent]  = useState(store.cancelUrgentDays ?? DEFAULT_CANCEL_URGENT);
  const [cancelSoon,    setCancelSoon]    = useState(store.cancelSoonDays   ?? DEFAULT_CANCEL_SOON);
  const fileRef = useRef();

  const handleSave = () => {
    store.update({
      tripName,
      travelGreenMax:   Number(travelGreen),
      travelYellowMax:  Number(travelYellow),
      cancelUrgentDays: Number(cancelUrgent),
      cancelSoonDays:   Number(cancelSoon),
    });
    onClose();
  };

  const numInput = (value, onChange, min = 1) => (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={min}
      className="w-16 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2"
      style={inputStyle}
    />
  );

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ok = store.importData(ev.target.result);
      if (ok) onClose();
      else alert('שגיאה בייבוא הנתונים');
    };
    reader.readAsText(file);
  };

  const sectionLabel = (text) => (
    <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--c-muted)' }}>{text}</p>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-2xl w-full max-w-md shadow-xl"
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4"
          style={{ borderBottom: '1px solid var(--c-border)' }}
        >
          <h3 className="font-bold text-lg" style={{ color: 'var(--c-ink)' }}>{t.settings.title}</h3>
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

        <div className="p-4 space-y-5">
          {/* Trip name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--c-muted)' }}>
              {t.settings.tripName}
            </label>
            <input
              type="text"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder={t.settings.tripNamePlaceholder}
              autoFocus
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>

          {/* Travel time thresholds */}
          <div
            className="rounded-xl p-3 space-y-2.5"
            style={{ background: 'var(--c-vellum)', border: '1px solid var(--c-border)' }}
          >
            {sectionLabel(t.settings.travelThresholds)}
            <ThresholdRow
              dot="#22c55e"
              label={t.settings.travelGreen}
              labelColor="#15803d"
              right={numInput(travelGreen, setTravelGreen)}
            />
            <ThresholdRow
              dot="#f59e0b"
              label={t.settings.travelYellow}
              labelColor="#b45309"
              right={numInput(travelYellow, setTravelYellow)}
            />
            <ThresholdRow
              dot="#ef4444"
              label={t.settings.travelRed}
              labelColor="#b91c1c"
              right={
                <span className="w-16 text-center text-sm" style={{ color: 'var(--c-muted)' }}>
                  {travelYellow}+
                </span>
              }
            />
          </div>

          {/* Free cancellation thresholds */}
          <div
            className="rounded-xl p-3 space-y-2.5"
            style={{ background: 'var(--c-vellum)', border: '1px solid var(--c-border)' }}
          >
            {sectionLabel(t.settings.cancelThresholds)}
            <ThresholdRow
              dot="#ef4444"
              label={t.settings.cancelUrgent}
              labelColor="#b91c1c"
              right={numInput(cancelUrgent, setCancelUrgent)}
            />
            <ThresholdRow
              dot="#f59e0b"
              label={t.settings.cancelSoon}
              labelColor="#b45309"
              right={numInput(cancelSoon, setCancelSoon)}
            />
            <ThresholdRow
              dot="#22c55e"
              label={t.settings.cancelSafe}
              labelColor="#15803d"
              right={
                <span className="w-16 text-center text-sm" style={{ color: 'var(--c-muted)' }}>
                  {cancelSoon}+
                </span>
              }
            />
          </div>

          {/* Export / Import */}
          <div className="flex gap-2">
            <button
              onClick={store.exportData}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors"
              style={{ background: 'var(--c-vellum)', color: 'var(--c-ink)', border: '1px solid var(--c-border)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--c-border)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--c-vellum)'}
            >
              <Download size={14} />
              {t.settings.exportData}
            </button>
            <button
              onClick={() => fileRef.current.click()}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors"
              style={{ background: 'var(--c-vellum)', color: 'var(--c-ink)', border: '1px solid var(--c-border)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--c-border)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--c-vellum)'}
            >
              <Upload size={14} />
              {t.settings.importData}
            </button>
            <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex justify-end gap-2 p-4"
          style={{ borderTop: '1px solid var(--c-border)' }}
        >
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
            className="px-4 py-2 text-sm rounded-lg transition-opacity hover:opacity-80"
            style={{ background: 'var(--c-ink)', color: 'var(--c-vellum)' }}
          >
            {t.edit.save}
          </button>
        </div>
      </div>
    </div>
  );
}

function ThresholdRow({ dot, label, labelColor, right }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm" style={{ color: labelColor }}>
        <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ background: dot }} />
        {label}
      </span>
      {right}
    </div>
  );
}
