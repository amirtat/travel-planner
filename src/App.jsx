import { useState } from 'react';
import { useTravelStore } from './store';
import { useT } from './i18n';
import Header from './components/Header';
import ItineraryView from './components/ItineraryView';
import PlacesView from './components/PlacesView';
import SettingsModal from './components/SettingsModal';

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
        {tab === 'calculator' && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 1 0-4.773-4.773 3.375 3.375 0 0 0 4.774 4.774ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-500">{t.tabs.calculator}</p>
              <p className="text-sm mt-1">יושלב בקרוב מהמחשבון הקיים</p>
            </div>
          </div>
        )}
      </main>

      {showSettings && (
        <SettingsModal store={store} t={t} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
