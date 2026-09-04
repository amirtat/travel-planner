import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, ArrowLeft, Download, MapPin, Share2, Check, LogOut, UserCog, Eye, Camera } from 'lucide-react';
import CoverPhotoPicker from './CoverPhotoPicker';

export default function TripSelector({ store, joinError }) {
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [shareMenuId, setShareMenuId] = useState(null);
  const [copiedInfo, setCopiedInfo] = useState(null); // { id, role }
  const [pickerTrip, setPickerTrip] = useState(null);
  const menuRef = useRef(null);

  const legacyData = store.getLegacyData();

  // Close share menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShareMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  const handleShareAdmin = async (e, tripId) => {
    e.stopPropagation();
    setShareMenuId(null);
    const token = await store.generateShareToken(tripId);
    const base = window.location.origin + window.location.pathname;
    await navigator.clipboard.writeText(`${base}?join=${token}`);
    setCopiedInfo({ id: tripId, role: 'admin' });
    setTimeout(() => setCopiedInfo(null), 2500);
  };

  const handleShareGuest = async (e, tripId) => {
    e.stopPropagation();
    setShareMenuId(null);
    const token = await store.generateGuestToken(tripId);
    const base = window.location.origin + window.location.pathname;
    await navigator.clipboard.writeText(`${base}?guestjoin=${token}`);
    setCopiedInfo({ id: tripId, role: 'guest' });
    setTimeout(() => setCopiedInfo(null), 2500);
  };

  const isOwner = (trip) => trip.members?.includes(store.user?.uid);

  return (
    <div dir="rtl" lang="he" className="map-grid-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Wordmark */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
            style={{ background: 'var(--c-ink)' }}>
            <MapPin size={22} style={{ color: 'var(--c-amber)' }} />
          </div>
          <h1 className="text-4xl mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-ink)' }}>
            הטיולים שלי
          </h1>
          <p className="text-sm" style={{ color: 'var(--c-muted)' }}>בחר טיול או צור חדש</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>

          {/* User info */}
          <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
            <div className="flex items-center gap-2.5">
              {store.user?.photoURL ? (
                <img src={store.user.photoURL} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{ background: 'var(--c-amber-light)', color: 'var(--c-amber)' }}>
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
            <div className="mb-4 px-3 py-2 rounded-xl text-xs"
              style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' }}>
              {joinError}
            </div>
          )}

          {/* Existing trips */}
          {store.trips.length > 0 && (
            <div className="space-y-2 mb-6">
              {store.trips.map((trip) => {
                const owner = isOwner(trip);
                return (
                  <button
                    key={trip.id}
                    onClick={() => store.switchTrip(trip.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-start group"
                    style={{ border: '1px solid var(--c-border)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-amber)'; e.currentTarget.style.background = 'var(--c-amber-light)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.background = ''; }}
                  >
                    {/* Cover photo thumbnail */}
                    <div
                      className="relative shrink-0 w-11 h-11 rounded-lg overflow-hidden"
                      style={{ border: '1px solid var(--c-border)', background: 'var(--c-vellum)' }}
                      onClick={owner ? (e) => { e.stopPropagation(); setPickerTrip(trip); } : undefined}
                      title={owner ? 'שנה תמונת כיסוי' : undefined}
                    >
                      {trip.coverPhotoUrl ? (
                        <img src={trip.coverPhotoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--c-border)' }}>
                          <Camera size={14} />
                        </div>
                      )}
                      {owner && (
                        <div
                          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: 'rgba(0,0,0,0.45)' }}
                        >
                          <Camera size={12} color="white" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-sm block truncate" style={{ color: 'var(--c-ink)' }}>
                        {trip.name}
                      </span>
                      {!owner && (
                        <span className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: 'var(--c-muted)' }}>
                          <Eye size={10} /> אורח
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1" ref={shareMenuId === trip.id ? menuRef : null}>
                      {/* Share button — only for owners */}
                      {owner && (
                        <div className="relative">
                          <span
                            onClick={(e) => { e.stopPropagation(); setShareMenuId(shareMenuId === trip.id ? null : trip.id); }}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-all"
                            style={{ color: copiedInfo?.id === trip.id ? 'var(--c-amber)' : 'var(--c-muted)' }}
                            title="שתף טיול"
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--c-amber)'}
                            onMouseLeave={e => e.currentTarget.style.color = copiedInfo?.id === trip.id ? 'var(--c-amber)' : 'var(--c-muted)'}
                          >
                            {copiedInfo?.id === trip.id ? <Check size={13} /> : <Share2 size={13} />}
                          </span>

                          {shareMenuId === trip.id && (
                            <div
                              className="absolute z-20 rounded-xl shadow-lg overflow-hidden"
                              style={{
                                top: '100%',
                                insetInlineStart: 0,
                                minWidth: 180,
                                background: 'var(--c-surface)',
                                border: '1px solid var(--c-border)',
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={(e) => handleShareAdmin(e, trip.id)}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-start transition-colors"
                                style={{ color: 'var(--c-ink)', borderBottom: '1px solid var(--c-border)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--c-vellum)'}
                                onMouseLeave={e => e.currentTarget.style.background = ''}
                              >
                                <UserCog size={13} style={{ color: 'var(--c-amber)', flexShrink: 0 }} />
                                <span>
                                  <span className="font-semibold block">שתף כעורך</span>
                                  <span style={{ color: 'var(--c-muted)' }}>יכול לערוך הכל</span>
                                </span>
                              </button>
                              <button
                                onClick={(e) => handleShareGuest(e, trip.id)}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-start transition-colors"
                                style={{ color: 'var(--c-ink)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--c-vellum)'}
                                onMouseLeave={e => e.currentTarget.style.background = ''}
                              >
                                <Eye size={13} style={{ color: 'var(--c-muted)', flexShrink: 0 }} />
                                <span>
                                  <span className="font-semibold block">שתף כאורח</span>
                                  <span style={{ color: 'var(--c-muted)' }}>צפייה בלבד</span>
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Delete — only for owners */}
                      {owner && (
                        <span
                          onClick={(e) => handleDelete(e, trip.id, trip.name)}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 transition-all"
                          style={{ color: 'var(--c-muted)' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--c-muted)'}
                        >
                          <Trash2 size={13} />
                        </span>
                      )}

                      <ArrowLeft size={14} style={{ color: 'var(--c-muted)' }} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Copy feedback */}
          {copiedInfo && (
            <p className="text-xs text-center mb-3" style={{ color: 'var(--c-amber)' }}>
              {copiedInfo.role === 'admin'
                ? 'קישור עריכה הועתק ✓ שלח לבן/בת הזוג'
                : 'קישור צפייה הועתק ✓ שלח למי שתרצה'}
            </p>
          )}

          {/* Import legacy */}
          {legacyData && (
            <div className="mb-5 p-3 rounded-xl text-sm"
              style={{ background: 'var(--c-amber-light)', border: '1px solid var(--c-amber-mid)' }}>
              <p className="mb-2" style={{ color: 'var(--c-ink)' }}>נמצאו נתונים שמורים מקומית</p>
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

          {store.trips.length === 0 && (
            <p className="text-xs mb-3" style={{ color: 'var(--c-muted)' }}>צור את הטיול הראשון שלך</p>
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

      {pickerTrip && (
        <CoverPhotoPicker
          trip={pickerTrip}
          store={store}
          onClose={() => setPickerTrip(null)}
        />
      )}
    </div>
  );
}
