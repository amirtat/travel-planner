import { Map, MapPin, Calculator, Settings, Globe } from 'lucide-react';

const TABS = [
  { key: 'itinerary', icon: Map },
  { key: 'places', icon: MapPin },
  { key: 'calculator', icon: Calculator },
];

export default function Header({ store, t, tab, onTabChange, onSettings }) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Map size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-sm leading-none">{t.appTitle}</h1>
              {store.tripName && (
                <p className="text-xs text-gray-400 mt-0.5">{store.tripName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => store.update({ language: store.language === 'he' ? 'en' : 'he' })}
              className="text-xs px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 font-medium transition-colors"
            >
              {store.language === 'he' ? 'EN' : 'עב'}
            </button>
            <button
              onClick={store.clearActiveTrip}
              title="החלף טיול"
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Globe size={17} />
            </button>
            <button
              onClick={onSettings}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings size={17} />
            </button>
          </div>
        </div>

        <div className="flex gap-0.5">
          {TABS.map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon size={14} />
              {t.tabs[key]}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
