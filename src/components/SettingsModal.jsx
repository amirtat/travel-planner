import { useState, useRef } from 'react';
import { X, Download, Upload } from 'lucide-react';

const DEFAULT_TRAVEL_GREEN  = 30;
const DEFAULT_TRAVEL_YELLOW = 60;
const DEFAULT_CANCEL_URGENT = 3;
const DEFAULT_CANCEL_SOON   = 7;

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
      className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">{t.settings.title}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.settings.tripName}
            </label>
            <input
              type="text"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder={t.settings.tripNamePlaceholder}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Travel time thresholds */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.settings.travelThresholds}</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  {t.settings.travelGreen}
                </span>
                {numInput(travelGreen, setTravelGreen)}
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-amber-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  {t.settings.travelYellow}
                </span>
                {numInput(travelYellow, setTravelYellow)}
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-red-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                  {t.settings.travelRed}
                </span>
                <span className="w-16 text-center text-sm text-gray-400">{travelYellow}+</span>
              </div>
            </div>
          </div>

          {/* Free cancellation thresholds */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.settings.cancelThresholds}</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-red-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                  {t.settings.cancelUrgent}
                </span>
                {numInput(cancelUrgent, setCancelUrgent)}
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-amber-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  {t.settings.cancelSoon}
                </span>
                {numInput(cancelSoon, setCancelSoon)}
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  {t.settings.cancelSafe}
                </span>
                <span className="w-16 text-center text-sm text-gray-400">{cancelSoon}+</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={store.exportData}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
            >
              <Download size={14} />
              {t.settings.exportData}
            </button>
            <button
              onClick={() => fileRef.current.click()}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
            >
              <Upload size={14} />
              {t.settings.importData}
            </button>
            <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t.edit.cancel}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t.edit.save}
          </button>
        </div>
      </div>
    </div>
  );
}
