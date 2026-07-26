import { useState } from 'react';
import { Plus, Globe, Trash2, ArrowLeft, Download } from 'lucide-react';

export default function TripSelector({ store }) {
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const legacyData = store.getLegacyData();

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    await store.createTrip(newName.trim(), 'he');
    setCreating(false);
    setNewName('');
  };

  const handleImportLegacy = async () => {
    const name = legacyData.tripName || legacyData.name || 'הטיול שלי';
    await store.createTrip(name, legacyData.language || 'he', legacyData);
    store.clearLegacyData();
  };

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
    if (!confirm(`למחוק את "${name}"?`)) return;
    await store.deleteTrip(id);
  };

  return (
    <div dir="rtl" lang="he" className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Globe size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">הטיולים שלי</h1>
            <p className="text-xs text-gray-400">בחר טיול קיים או צור חדש</p>
          </div>
        </div>

        {/* Existing trips */}
        {store.trips.length > 0 && (
          <div className="space-y-2 mb-5">
            {store.trips.map((trip) => (
              <button
                key={trip.id}
                onClick={() => store.switchTrip(trip.id)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group text-start"
              >
                <span className="font-medium text-gray-800">{trip.name}</span>
                <div className="flex items-center gap-1">
                  <span
                    onClick={(e) => handleDelete(e, trip.id, trip.name)}
                    className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </span>
                  <ArrowLeft size={15} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Import from localStorage */}
        {legacyData && (
          <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-800 mb-2">
              נמצאו נתונים שמורים מקומית — רוצה לייבא אותם?
            </p>
            <button
              onClick={handleImportLegacy}
              className="flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors"
            >
              <Download size={14} />
              ייבא כטיול חדש ({legacyData.tripName || legacyData.name || 'ללא שם'})
            </button>
          </div>
        )}

        {/* Create new */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {store.trips.length === 0 ? 'צור את הטיול הראשון שלך' : 'טיול חדש'}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="למשל: יפן 2027"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors whitespace-nowrap font-medium"
            >
              <Plus size={15} />
              צור
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
