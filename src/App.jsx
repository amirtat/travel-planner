import { useState, useEffect } from 'react';
import { useTravelStore } from './store';
import { useT } from './i18n';
import Header from './components/Header';
import ItineraryView from './components/ItineraryView';
import PlacesView from './components/PlacesView';
import SettingsModal from './components/SettingsModal';
import BuiltinCalculator from './components/BuiltinCalculator';
import TripSelector from './components/TripSelector';
import LoginScreen from './components/LoginScreen';

export default function App() {
  const store = useTravelStore();
  const t = useT(store.language);
  const [tab, setTab] = useState('itinerary');
  const [showSettings, setShowSettings] = useState(false);
  const [joinError, setJoinError] = useState(null);

  const isRTL = store.language === 'he';

  // Handle ?join=TOKEN in URL — runs after user is authenticated
  useEffect(() => {
    if (!store.user) return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('join');
    if (!token) return;

    // Remove the query param immediately so it doesn't trigger again
    window.history.replaceState({}, '', window.location.pathname);

    store.joinTripByToken(token)
      .then((tripId) => store.switchTrip(tripId))
      .catch(() => setJoinError('הקישור לא תקין או שהטיול לא נמצא'));
  }, [store.user?.uid]);

  // Auth loading
  if (store.authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--c-vellum)' }}>
        <div className="text-sm animate-pulse" style={{ color: 'var(--c-muted)' }}>טוען...</div>
      </div>
    );
  }

  // Not signed in
  if (!store.user) {
    return <LoginScreen store={store} />;
  }

  // Trips loading
  if (store.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--c-vellum)' }}>
        <div className="text-sm animate-pulse" style={{ color: 'var(--c-muted)' }}>טוען...</div>
      </div>
    );
  }

  // No active trip — show selector
  if (!store.activeTripId) {
    return <TripSelector store={store} joinError={joinError} />;
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} lang={store.language} className="min-h-screen flex flex-col" style={{ background: 'var(--c-vellum)' }}>
      <Header
        store={store}
        t={t}
        tab={tab}
        onTabChange={setTab}
        onSettings={() => setShowSettings(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {tab === 'itinerary' && <ItineraryView store={store} t={t} />}
        {tab === 'places' && <PlacesView store={store} t={t} />}
        {tab === 'calculator' && <BuiltinCalculator store={store} t={t} />}
      </main>

      {showSettings && (
        <SettingsModal store={store} t={t} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
