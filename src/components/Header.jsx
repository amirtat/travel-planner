import { Map, MapPin, Calculator, Globe, Settings } from 'lucide-react';

const TABS = [
  { key: 'itinerary',  icon: Map },
  { key: 'places',     icon: MapPin },
  { key: 'calculator', icon: Calculator },
];

export default function Header({ store, t, tab, onTabChange, onSettings }) {
  return (
    <header style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}
      className="sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">

          {/* Trip name */}
          <div>
            <p className="text-[11px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>
              {t.appTitle}
            </p>
            <h1
              className="text-lg leading-none"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--c-ink)' }}
            >
              {store.tripName || '—'}
            </h1>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => store.update({ language: store.language === 'he' ? 'en' : 'he' })}
              className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors"
              style={{
                background: 'var(--c-vellum)',
                color: 'var(--c-muted)',
                border: '1px solid var(--c-border)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {store.language === 'he' ? 'EN' : 'עב'}
            </button>
            <button
              onClick={store.clearActiveTrip}
              title="החלף טיול"
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--c-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-amber)'; e.currentTarget.style.background = 'var(--c-amber-light)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)'; e.currentTarget.style.background = ''; }}
            >
              <Globe size={16} />
            </button>
            <button
              onClick={onSettings}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--c-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-ink)'; e.currentTarget.style.background = 'var(--c-vellum)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)'; e.currentTarget.style.background = ''; }}
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0">
          {TABS.map(({ key, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => onTabChange(key)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap"
                style={{
                  borderColor: active ? 'var(--c-amber)' : 'transparent',
                  color: active ? 'var(--c-amber)' : 'var(--c-muted)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <Icon size={14} />
                {t.tabs[key]}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
