import { useState } from 'react';
import { Plus, Pencil, Trash2, ExternalLink, Route } from 'lucide-react';
import DayEditModal from './DayEditModal';
import PlaceDetailModal from './PlaceDetailModal';
import DayInsightsPanel from './DayInsightsPanel';

function formatDate(dateStr, language) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (language === 'he') {
    return `${d.getDate()}.${d.getMonth() + 1}.${String(d.getFullYear()).slice(2)}`;
  }
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function getDayName(dateStr, dayNames) {
  if (!dateStr) return '';
  return dayNames[new Date(dateStr + 'T00:00:00').getDay()];
}

function getCancelInfo(cancelDate, t) {
  if (!cancelDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cancel = new Date(cancelDate + 'T00:00:00');
  const diff = Math.floor((cancel - today) / 86400000);

  if (diff < 0) return { label: t.cancelStatus.expired, cls: 'bg-red-100 text-red-700 border-red-200' };
  if (diff === 0) return { label: `⚠ ${t.cancelStatus.urgent}`, cls: 'bg-red-100 text-red-700 border-red-200 animate-pulse' };
  if (diff <= 3)  return { label: `${diff}d · ${t.cancelStatus.urgent}`, cls: 'bg-red-100 text-red-700 border-red-200' };
  if (diff <= 7)  return { label: `${diff}d · ${t.cancelStatus.soon}`, cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  if (diff <= 14) return { label: `${diff}d · ${t.cancelStatus.safe}`, cls: 'bg-blue-100 text-blue-700 border-blue-200' };
  return { label: `${diff}d · ${t.cancelStatus.safe}`, cls: 'bg-green-100 text-green-700 border-green-200' };
}

export default function ItineraryView({ store, t }) {
  const [editDay, setEditDay] = useState(null);
  const [viewPlace, setViewPlace] = useState(null);
  const [expandedInsights, setExpandedInsights] = useState(new Set());

  const toggleInsights = (id) =>
    setExpandedInsights((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const today = new Date().toISOString().slice(0, 10);

  const handleDelete = (id) => {
    if (confirm(t.edit.confirmDelete)) store.deleteDay(id);
  };

  const getPlace = (id) => store.places.find((p) => p.id === id);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">{t.itinerary.title}</h2>
        <button
          onClick={() => setEditDay('new')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus size={15} />
          {t.itinerary.addDay}
        </button>
      </div>

      {store.days.length === 0 ? (
        <div className="text-center text-gray-400 py-20 bg-white rounded-xl border border-dashed border-gray-200 text-sm">
          {t.itinerary.noData}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs">
                  {[
                    t.itinerary.date,
                    t.itinerary.dayName,
                    t.itinerary.activities,
                    t.itinerary.accommodation,
                    t.itinerary.region,
                    t.itinerary.freeCancellation,
                    t.itinerary.notes,
                    '',
                  ].map((h, i) => (
                    <th
                      key={i}
                      className="px-3 py-3 font-semibold text-gray-500 text-start whitespace-nowrap uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {store.days.map((day) => {
                  const isToday = day.date === today;
                  const isPast = day.date < today;
                  const place = day.accommodationId ? getPlace(day.accommodationId) : null;
                  const cancelDate = place?.freeCancellation ?? day.freeCancellation;
                  const cancelInfo = getCancelInfo(cancelDate, t);
                  const insightsOpen = expandedInsights.has(day.id);
                  const hasStops = (day.stops?.length > 0) || day.accommodationId;

                  return (
                    <>
                    <tr
                      key={day.id}
                      className={`border-b border-gray-100 last:border-0 ${
                        isToday
                          ? 'bg-blue-50'
                          : isPast
                          ? 'bg-gray-50/60 opacity-75'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Date */}
                      <td className="px-3 py-3 whitespace-nowrap font-semibold text-gray-700">
                        {isToday && (
                          <span className="inline-block bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded me-1 font-normal">
                            {t.itinerary.today}
                          </span>
                        )}
                        {formatDate(day.date, store.language)}
                      </td>

                      {/* Day name */}
                      <td className="px-3 py-3 whitespace-nowrap text-gray-500">
                        {getDayName(day.date, t.dayNames)}
                      </td>

                      {/* Activities */}
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(day.activities || []).map((act, i) => (
                            <span
                              key={i}
                              className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                            >
                              {act}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Accommodation */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {place ? (
                          <button
                            onClick={() => setViewPlace(place)}
                            className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                          >
                            {place.name}
                            {place.bookingUrl && <ExternalLink size={11} />}
                          </button>
                        ) : (
                          <span className="text-gray-600">{day.accommodationName || '—'}</span>
                        )}
                      </td>

                      {/* Region */}
                      <td className="px-3 py-3 whitespace-nowrap text-gray-600">
                        {day.region || '—'}
                      </td>

                      {/* Free cancellation */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {cancelInfo ? (
                          <div>
                            <span
                              className={`text-xs px-2 py-0.5 rounded border font-medium ${cancelInfo.cls}`}
                            >
                              {cancelInfo.label}
                            </span>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {formatDate(cancelDate, store.language)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="px-3 py-3 text-gray-500 max-w-xs">
                        <p className="truncate max-w-[200px]">{day.notes || ''}</p>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => toggleInsights(day.id)}
                            title="ניתוח מסלול"
                            className={`p-1.5 rounded transition-colors ${
                              insightsOpen
                                ? 'text-indigo-600 bg-indigo-50'
                                : 'text-gray-300 hover:text-indigo-500 hover:bg-indigo-50'
                            }`}
                          >
                            <Route size={13} />
                          </button>
                          <button
                            onClick={() => setEditDay(day)}
                            className="p-1.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(day.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {insightsOpen && (
                      <tr key={`${day.id}-insights`} className="border-b border-gray-100 last:border-0">
                        <td colSpan={8} className="p-0">
                          <DayInsightsPanel day={day} places={store.places} store={store} />
                        </td>
                      </tr>
                    )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editDay !== null && (
        <DayEditModal
          day={editDay === 'new' ? null : editDay}
          store={store}
          t={t}
          onClose={() => setEditDay(null)}
        />
      )}

      {viewPlace && (
        <PlaceDetailModal
          place={viewPlace}
          store={store}
          t={t}
          onClose={() => setViewPlace(null)}
        />
      )}
    </div>
  );
}
