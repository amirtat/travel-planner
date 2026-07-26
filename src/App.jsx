import { useState } from 'react';
import { useTravelStore } from './store';
import { useT } from './i18n';
import Header from './components/Header';
import ItineraryView from './components/ItineraryView';
import PlacesView from './components/PlacesView';
import SettingsModal from './components/SettingsModal';
import BuiltinCalculator from './components/BuiltinCalculator';

export default function App() {
  const store = useTravelStore();
  const t = useT(store.language);
  const [tab, setTab] = useState('itinerary');
  const [showSettings, setShowSettings] = useState(false);

  const isRTL = store.language === 'he';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} lang={store.language} className="min-h-screen bg-gray-50 flex flex-col">
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
