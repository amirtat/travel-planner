import { useState } from 'react';
import { Plus, Pencil, Trash2, ExternalLink, Route, AlertTriangle, Hotel } from 'lucide-react';
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

function getCancelInfo(cancelDate, t, urgentDays = 3, soonDays = 7) {
  if (!cancelDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cancel = new Date(cancelDate + 'T00:00:00');
  const diff = Math.floor((cancel - today) / 86400000);
  if (diff < 0)           return { label: t.cancelStatus.expired, urgent: false, expired: true };
  if (diff === 0)         return { label: `⚠ ${t.cancelStatus.urgent}`, urgent: true };
  if (diff <= urgentDays) return { label: `${diff}d · ${t.cancelStatus.urgent}`, urgent: true };
  if (diff <= soonDays)   return { label: `${diff}d · ${t.cancelStatus.soon}`, urgent: false, soon: true };
  return { label: `${diff}d · ${t.cancelStatus.safe}`, urgent: false };
}

function CancelBadge({ info, date, language }) {
  if (!info) return null;
  const baseStyle = {
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 999,
    fontWeight: 500,
    border: '1px solid',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  };
  const style = info.expired
    ? { ...baseStyle, color: '#b91c1c', borderColor: '#fca5a5', background: '#fef2f2' }
    : info.urgent
    ? { ...baseStyle, color: '#b91c1c', borderColor: '#fca5a5', background: '#fef2f2' }
    : info.soon
    ? { ...baseStyle, color: '#b45309', borderColor: '#fbbf24', background: '#fffbeb' }
    : { ...baseStyle, color: '#15803d', borderColor: '#86efac', background: '#f0fdf4' };

  return (
    <span style={style} className={info.urgent && !info.expired ? 'animate-amber-pulse' : ''}>
      {info.label}
      {date && <span style={{ opacity: 0.65 }}>· {formatDate(date, language)}</span>}
    </span>
  );
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
  const handleDelete = (id) => { if (confirm(t.edit.confirmDelete)) store.deleteDay(id); };
  const getPlace = (id) => store.places.find((p) => p.id === id);

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-ink)' }}>
          {t.itinerary.title}
        </h2>
        <button
          onClick={() => setEditDay('new')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: 'var(--c-ink)', color: 'var(--c-vellum)' }}
        >
          <Plus size={14} />
          {t.itinerary.addDay}
        </button>
      </div>

      {store.days.length === 0 ? (
        <div className="text-center py-24 text-sm" style={{ color: 'var(--c-muted)' }}>
          {t.itinerary.noData}
        </div>
      ) : (
        <div className="relative">
          {/* Vertical timeline rail — inline-start = right in RTL, left in LTR */}
          <div
            className="absolute top-8 bottom-8 w-px pointer-events-none"
            style={{
              insetInlineStart: '3.35rem',
              background: 'linear-gradient(to bottom, transparent, var(--c-amber) 8%, var(--c-amber) 92%, transparent)',
              opacity: 0.18,
            }}
          />

          <div className="space-y-4">
            {store.days.map((day, dayIndex) => {
              const isToday = day.date === today;
              const isPast  = day.date && day.date < today;
              const place   = day.accommodationId ? getPlace(day.accommodationId) : null;
              const cancelDate = place?.freeCancellation ?? day.freeCancellation;
              const cancelInfo = getCancelInfo(cancelDate, t, store.cancelUrgentDays ?? 3, store.cancelSoonDays ?? 7);
              const insightsOpen = expandedInsights.has(day.id);

              const prevDay   = dayIndex > 0 ? store.days[dayIndex - 1] : null;
              const gapDays   = prevDay
                ? Math.round((new Date(day.date + 'T00:00:00') - new Date(prevDay.date + 'T00:00:00')) / 86400000) - 1
                : 0;
              const prevPlace = prevDay?.accommodationId
                ? store.places.find((p) => p.id === prevDay.accommodationId)
                : null;

              const d = day.date ? new Date(day.date + 'T00:00:00') : null;
              const dayNum   = d ? String(d.getDate()).padStart(2, '0') : '--';
              const monthStr = d ? `${d.getMonth() + 1}.${String(d.getFullYear()).slice(2)}` : '';

              return (
                <div key={day.id}>
                  {/* Gap warning */}
                  {gapDays > 0 && (
                    <div
                      className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl mb-3"
                      style={{
                        marginInlineStart: '5.5rem',
                        background: 'rgba(156,106,34,0.08)',
                        border: '1px solid var(--c-amber-mid)',
                        color: 'var(--c-amber)',
                      }}
                    >
                      <AlertTriangle size={12} />
                      {gapDays === 1 ? 'יום חסר במסלול' : `${gapDays} ימים חסרים במסלול`}
                    </div>
                  )}

                  {/* Day row: [date column] [card] — date is inline-start (right in RTL, left in LTR) */}
                  <div className={`flex gap-5 items-start ${isPast ? 'opacity-55' : ''}`}>

                    {/* Date column (inline-start → right in RTL, left in LTR) */}
                    <div className="shrink-0 w-16 text-end relative pt-1.5">
                      {/* Timeline dot */}
                      <div
                        className="absolute z-10 rounded-full"
                        style={{
                          width:  isToday ? 11 : 7,
                          height: isToday ? 11 : 7,
                          top: 20,
                          insetInlineEnd: isToday ? -4 : -3,
                          background: isToday ? 'var(--c-amber)' : 'var(--c-border)',
                          outline: isToday ? '3px solid var(--c-amber-light)' : 'none',
                        }}
                      />
                      {/* Big ghost day number */}
                      <div
                        className="leading-none select-none"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '2.25rem',
                          fontWeight: 500,
                          color: isToday ? 'var(--c-amber)' : 'var(--c-ink)',
                          opacity: isToday ? 0.85 : 0.14,
                          letterSpacing: '-0.03em',
                        }}
                      >
                        {dayNum}
                      </div>
                      <div
                        className="text-[10px] uppercase tracking-widest"
                        style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-body)' }}
                      >
                        {getDayName(day.date, t.dayNames)}
                      </div>
                      <div
                        className="text-[10px] mt-0.5"
                        style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-muted)', opacity: 0.6 }}
                      >
                        {monthStr}
                      </div>
                    </div>

                    {/* Card */}
                    <div
                      className="flex-1 rounded-2xl overflow-hidden transition-all"
                      style={{
                        background: 'var(--c-surface)',
                        border: `1px solid ${isToday ? 'var(--c-amber)' : 'var(--c-border)'}`,
                        boxShadow: isToday ? '0 0 0 3px var(--c-amber-light)' : '0 1px 3px rgba(27,42,59,0.04)',
                      }}
                    >
                      <div className="p-4">
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0">
                            {isToday && (
                              <span
                                className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider mb-1.5"
                                style={{ background: 'var(--c-amber)', color: 'white', fontFamily: 'var(--font-mono)' }}
                              >
                                {t.itinerary.today}
                              </span>
                            )}
                            {/* Accommodation */}
                            {place ? (
                              <button
                                onClick={() => setViewPlace(place)}
                                className="flex items-center gap-1.5 font-semibold text-sm hover:underline text-start"
                                style={{ color: 'var(--c-ink)' }}
                              >
                                <Hotel size={13} style={{ color: 'var(--c-amber)', flexShrink: 0 }} />
                                <span className="truncate">{place.name}</span>
                                {place.bookingUrl && <ExternalLink size={10} style={{ color: 'var(--c-muted)', flexShrink: 0 }} />}
                              </button>
                            ) : day.accommodationName ? (
                              <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--c-muted)' }}>
                                <Hotel size={13} style={{ flexShrink: 0 }} />
                                {day.accommodationName}
                              </span>
                            ) : (
                              <span className="text-sm" style={{ color: 'var(--c-border)' }}>ללא לינה</span>
                            )}
                            {day.region && (
                              <div className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>
                                {day.region}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-0.5 shrink-0">
                            <ActionBtn
                              onClick={() => toggleInsights(day.id)}
                              title="ניתוח מסלול"
                              active={insightsOpen}
                            >
                              <Route size={13} />
                            </ActionBtn>
                            <ActionBtn onClick={() => setEditDay(day)} title={t.edit.edit}>
                              <Pencil size={13} />
                            </ActionBtn>
                            <ActionBtn onClick={() => handleDelete(day.id)} title={t.edit.delete} danger>
                              <Trash2 size={13} />
                            </ActionBtn>
                          </div>
                        </div>

                        {/* Place chips */}
                        {(day.items || []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {(day.items || []).map((item, i) => {
                              if (item.type === 'place') {
                                const p = store.places.find((pl) => pl.id === item.id);
                                if (!p) return null;
                                return (
                                  <button
                                    key={i}
                                    onClick={() => setViewPlace(p)}
                                    className="text-xs px-2.5 py-1 rounded-full transition-all"
                                    style={{
                                      background: 'var(--c-amber-light)',
                                      color: 'var(--c-amber)',
                                      border: '1px solid var(--c-amber-mid)',
                                    }}
                                  >
                                    {p.name}
                                  </button>
                                );
                              }
                              return (
                                <span
                                  key={i}
                                  className="text-xs px-2.5 py-1 rounded-full"
                                  style={{
                                    background: 'var(--c-vellum)',
                                    color: 'var(--c-muted)',
                                    border: '1px solid var(--c-border)',
                                  }}
                                >
                                  {item.value}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Footer: cancellation + notes */}
                        {(cancelInfo || day.notes) && (
                          <div className="flex items-center gap-3 flex-wrap">
                            <CancelBadge info={cancelInfo} date={cancelDate} language={store.language} />
                            {day.notes && (
                              <p className="text-xs truncate max-w-[220px]" style={{ color: 'var(--c-muted)' }}>
                                {day.notes}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Route panel */}
                      {insightsOpen && (
                        <DayInsightsPanel
                          day={day}
                          places={store.places}
                          store={store}
                          prevPlace={prevPlace}
                        />
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editDay !== null && (
        <DayEditModal day={editDay === 'new' ? null : editDay} store={store} t={t} onClose={() => setEditDay(null)} />
      )}
      {viewPlace && (
        <PlaceDetailModal place={viewPlace} store={store} t={t} onClose={() => setViewPlace(null)} />
      )}
    </div>
  );
}

function ActionBtn({ onClick, title, active, danger, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-lg transition-colors"
      style={{
        color: active ? 'var(--c-amber)' : 'var(--c-border)',
        background: active ? 'var(--c-amber-light)' : undefined,
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.color = danger ? '#dc2626' : 'var(--c-ink)';
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.color = 'var(--c-border)';
      }}
    >
      {children}
    </button>
  );
}
