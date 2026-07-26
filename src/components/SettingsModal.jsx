import { useState, useRef } from 'react';
import { X, Download, Upload } from 'lucide-react';

export default function SettingsModal({ store, t, onClose }) {
  const [tripName, setTripName] = useState(store.tripName || '');
  const fileRef = useRef();

  const handleSave = () => {
    store.update({ tripName });
    onClose();
  };

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
