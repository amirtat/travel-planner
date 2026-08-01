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
import FaqModal from './components/FaqModal';

export default function App() {
  const store = useTravelStore();
  const t = useT(store.language);
  const [tab, setTab] = useState('itinerary');
  const [showSettings, setShowSettings] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const [joinError, setJoinError] = useState(null);

  const isRTL = store.language === 'he';

  // Handle ?join=TOKEN or ?guestjoin=TOKEN in URL
  useEffect(() => {
    if (!store.user) return;
    const params = new URLSearchParams(window.location.search);
    const adminToken = params.get('join');
    const guestToken = params.get('guestjoin');
    if (!adminToken && !guestToken) return;

    window.history.replaceState({}, '', window.location.pathname);

    if (adminToken) {
      store.joinTripByToken(adminToken)
        .then((id) => store.switchTrip(id))
        .catch(() => setJoinError('הקישור לא תקין או שהטיול לא נמצא'));
    } else {
      store.joinTripAsGuest(guestToken)
        .then((id) => store.switchTrip(id))
        .catch(() => setJoinError('קישור האורח לא תקין או שהטיול לא נמצא'));
    }
  }, [store.user?.uid]);

  if (store.authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--c-vellum)' }}>
        <div className="text-sm animate-pulse" style={{ color: 'var(--c-muted)' }}>טוען...</div>
      </div>
    );
  }

  if (!store.user) return <LoginScreen store={store} />;

  if (store.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--c-vellum)' }}>
        <div className="text-sm animate-pulse" style={{ color: 'var(--c-muted)' }}>טוען...</div>
      </div>
    );
  }

  if (!store.activeTripId) {
    return <TripSelector store={store} joinError={joinError} />;
  }

  const isReadOnly = store.isReadOnly;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} lang={store.language} className="min-h-screen flex flex-col" style={{ background: 'var(--c-vellum)' }}>
      <Header
        store={store}
        t={t}
        tab={tab}
        onTabChange={setTab}
        onSettings={() => setShowSettings(true)}
        onFaq={() => setShowFaq(true)}
        isReadOnly={isReadOnly}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {tab === 'itinerary'  && <ItineraryView  store={store} t={t} isReadOnly={isReadOnly} />}
        {tab === 'places'     && <PlacesView     store={store} t={t} isReadOnly={isReadOnly} />}
        {tab === 'calculator' && <BuiltinCalculator store={store} t={t} />}
      </main>

      {showSettings && !isReadOnly && (
        <SettingsModal store={store} t={t} onClose={() => setShowSettings(false)} />
      )}
      {showFaq && (
        <FaqModal language={store.language} onClose={() => setShowFaq(false)} />
      )}
    </div>
  );
}
