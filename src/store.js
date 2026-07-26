import { useState, useEffect } from 'react';

const STORAGE_KEY = 'travel-planner-v1';

const DEFAULT_DATA = {
  tripName: '',
  language: 'he',
  days: [],
  places: [],
};

function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? { ...defaultValue, ...JSON.parse(stored) } : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function sortDays(days) {
  return [...days].sort((a, b) => a.date.localeCompare(b.date));
}

export function useTravelStore() {
  const [data, setData] = useLocalStorage(STORAGE_KEY, DEFAULT_DATA);

  const update = (partial) => setData((prev) => ({ ...prev, ...partial }));

  // --- Days ---
  const addDay = (day) => {
    const newDay = { id: generateId(), ...day };
    setData((prev) => ({ ...prev, days: sortDays([...prev.days, newDay]) }));
    return newDay.id;
  };

  const updateDay = (id, changes) => {
    setData((prev) => ({
      ...prev,
      days: sortDays(prev.days.map((d) => (d.id === id ? { ...d, ...changes } : d))),
    }));
  };

  const deleteDay = (id) => {
    setData((prev) => ({ ...prev, days: prev.days.filter((d) => d.id !== id) }));
  };

  // --- Places ---
  const addPlace = (place) => {
    const newPlace = { id: generateId(), ...place };
    setData((prev) => ({ ...prev, places: [...prev.places, newPlace] }));
    return newPlace.id;
  };

  const updatePlace = (id, changes) => {
    setData((prev) => ({
      ...prev,
      places: prev.places.map((p) => (p.id === id ? { ...p, ...changes } : p)),
    }));
  };

  const deletePlace = (id) => {
    setData((prev) => ({
      ...prev,
      places: prev.places.filter((p) => p.id !== id),
      days: prev.days.map((d) =>
        d.accommodationId === id ? { ...d, accommodationId: null } : d
      ),
    }));
  };

  // --- Import / Export ---
  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.tripName || 'trip'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (json) => {
    try {
      const parsed = JSON.parse(json);
      setData({ ...DEFAULT_DATA, ...parsed });
      return true;
    } catch {
      return false;
    }
  };

  return {
    ...data,
    update,
    addDay,
    updateDay,
    deleteDay,
    addPlace,
    updatePlace,
    deletePlace,
    exportData,
    importData,
  };
}
