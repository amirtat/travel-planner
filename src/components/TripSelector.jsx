import { useState } from 'react';
import { Plus, Trash2, ArrowLeft, Download, MapPin, Share2, Check, LogOut } from 'lucide-react';

export default function TripSelector({ store, joinError }) {
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

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

  const handleShare = async (e, tripId) => {
    e.stopPropagation();
    const token = await store.generateShareToken(tripId);
    const base = window.location.origin + window.location.pathname;
    const url = `${base}?join=${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(tripId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div
      dir="rtl"
      lang="he"
      className="map-grid-bg min-h-screen flex items-center justify-center p-4"
    >
      <div className="w-full max-w-sm">

        {/* Wordmark */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
            style={{ background: 'var(--c-ink)' }}>
            <MapPin size={22} style={{ color: 'var(--c-amber)' }} />
          </div>
          <h1
            className="text-4xl mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--c-ink)' }}
          >
            הטיולים שלי
          </h1>
          <p className="text-sm" style={{ color: 'var(--c-muted)' }}>
            בחר טיול או צור חדש
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 shadow-sm"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          {/* User info */}
          <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
            <div className="flex items-center gap-2.5">
              {store.user?.photoURL ? (
                <img
                  src={store.user.photoURL}
                  alt=""
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{ background: 'var(--c-amber-light)', color: 'var(--c-amber)' }}
                >
                  {store.user?.displayName?.[0] ?? '?'}
                </div>
              )}
              <span className="text-sm font-medium truncate max-w-[150px]" style={{ color: 'var(--c-ink)' }}>
                {store.user?.displayName ?? store.user?.email}
              </span>
            </div>
            <button
              onClick={store.signOut}
              title="התנתק"
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--c-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)'; e.currentTarget.style.background = ''; }}
            >
              <LogOut size={15} />
            </button>
          </div>

          {/* Join error */}
          {joinError && (
            <div
              className="mb-4 px-3 py-2 rounded-xl text-xs"
              style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' }}
            >
              {joinError}
            </div>
          )}

          {/* Existing trips */}
          {store.trips.length > 0 && (
            <div className="space-y-2 mb-6">
              {store.trips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => store.switchTrip(trip.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-all text-start group"
                  style={{ border: '1px solid var(--c-border)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--c-amber)';
                    e.currentTarget.style.background = 'var(--c-amber-light)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--c-border)';
                    e.currentTarget.style.background = '';
                  }}
                >
                  <span className="font-medium text-sm" style={{ color: 'var(--c-ink)' }}>
                    {trip.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {/* Share */}
                    <span
                      onClick={(e) => handleShare(e, trip.id)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 transition-all"
                      style={{ color: copiedId === trip.id ? 'var(--c-amber)' : 'var(--c-muted)' }}
                      title="העתק קישור שיתוף"
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--c-amber)'}
                      onMouseLeave={e => e.currentTarget.style.color = copiedId === trip.id ? 'var(--c-amber)' : 'var(--c-muted)'}
                    >
                      {copiedId === trip.id ? <Check size={13} /> : <Share2 size={13} />}
                    </span>
                    {/* Delete */}
                    <span
                      onClick={(e) => handleDelete(e, trip.id, trip.name)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 transition-all"
                      style={{ color: 'var(--c-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--c-muted)'}
                    >
                      <Trash2 size={13} />
                    </span>
                    <ArrowLeft size={14} style={{ color: 'var(--c-muted)' }} />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Copy feedback */}
          {copiedId && (
            <p className="text-xs text-center mb-3" style={{ color: 'var(--c-amber)' }}>
              קישור הצטרפות הועתק ✓ שלח לבן/בת הזוג
            </p>
          )}

          {/* Import legacy */}
          {legacyData && (
            <div
              className="mb-5 p-3 rounded-xl text-sm"
              style={{
                background: 'var(--c-amber-light)',
                border: '1px solid var(--c-amber-mid)',
              }}
            >
              <p className="mb-2" style={{ color: 'var(--c-ink)' }}>
                נמצאו נתונים שמורים מקומית
              </p>
              <button
                onClick={handleImportLegacy}
                className="flex items-center gap-1.5 font-medium text-sm"
                style={{ color: 'var(--c-amber)' }}
              >
                <Download size={13} />
                ייבא: {legacyData.tripName || legacyData.name || 'ללא שם'}
              </button>
            </div>
          )}

          {/* Divider */}
          {store.trips.length > 0 && (
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ background: 'var(--c-border)' }} />
              <span className="text-xs" style={{ color: 'var(--c-muted)' }}>טיול חדש</span>
              <div className="flex-1 h-px" style={{ background: 'var(--c-border)' }} />
            </div>
          )}

          {/* Create new */}
          {store.trips.length === 0 && (
            <p className="text-xs mb-3" style={{ color: 'var(--c-muted)' }}>
              צור את הטיול הראשון שלך
            </p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="למשל: יפן 2027"
              className="flex-1 text-sm px-3 py-2 rounded-lg outline-none transition-all"
              style={{
                background: 'var(--c-vellum)',
                border: '1px solid var(--c-border)',
                color: 'var(--c-ink)',
                fontFamily: 'var(--font-body)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--c-amber)'}
              onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
              autoFocus
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-opacity disabled:opacity-40"
              style={{ background: 'var(--c-ink)', color: 'var(--c-vellum)' }}
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
