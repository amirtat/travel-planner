import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';

const ACTIVE_TRIP_KEY = 'travel-planner-active-trip';
const LEGACY_KEY = 'travel-planner-v1';

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function sortDays(days) {
  return [...days].sort((a, b) => a.date.localeCompare(b.date));
}

function migrateDay(day) {
  if (day.items !== undefined) return day;
  const items = [
    ...(day.stops ?? []).map((id) => ({ type: 'place', id })),
    ...(day.activities ?? []).map((value) => ({ type: 'text', value })),
  ];
  const { activities, stops, ...rest } = day;
  return { ...rest, items };
}

function migrateData(data) {
  if (!data.days?.some((d) => d.items === undefined)) return data;
  return { ...data, days: data.days.map(migrateDay) };
}

export function useTravelStore() {
  const [trips, setTrips] = useState([]);
  const [activeTripId, setActiveTripId] = useState(
    () => localStorage.getItem(ACTIVE_TRIP_KEY) || null
  );
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tripsLoading, setTripsLoading] = useState(true);
  const saveTimeoutRef = useRef(null);

  // Real-time trips list
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'trips'), (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        name: d.data().name ?? d.data().tripName ?? 'ללא שם',
        language: d.data().language ?? 'he',
        createdAt: d.data().createdAt,
      }));
      list.sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0));
      setTrips(list);
      setTripsLoading(false);
    });
    return unsub;
  }, []);

  // Load active trip once on selection
  useEffect(() => {
    if (!activeTripId) {
      setTripData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getDoc(doc(db, 'trips', activeTripId)).then((snap) => {
      if (snap.exists()) {
        setTripData(migrateData(snap.data()));
      } else {
        localStorage.removeItem(ACTIVE_TRIP_KEY);
        setActiveTripId(null);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [activeTripId]);

  // Debounced Firestore save
  const saveToFirestore = useCallback((id, data) => {
    if (!id) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await setDoc(doc(db, 'trips', id), { ...data, updatedAt: serverTimestamp() });
      } catch (e) {
        console.error('Firestore save error:', e);
      }
    }, 1000);
  }, []);

  const updateTripData = useCallback((newData) => {
    setTripData(newData);
    saveToFirestore(activeTripId, newData);
  }, [activeTripId, saveToFirestore]);

  // --- Trip management ---
  const createTrip = async (name, language = 'he', initialData = null) => {
    const id = generateId();
    const base = { name, language, days: [], places: [] };
    const newTrip = {
      ...base,
      ...(initialData ? migrateData(initialData) : {}),
      name,
      language,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'trips', id), newTrip);
    localStorage.setItem(ACTIVE_TRIP_KEY, id);
    setActiveTripId(id);
    setTripData({ ...base, ...(initialData ? migrateData(initialData) : {}) });
    return id;
  };

  const switchTrip = (id) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      if (activeTripId && tripData) {
        setDoc(doc(db, 'trips', activeTripId), { ...tripData, updatedAt: serverTimestamp() });
      }
      saveTimeoutRef.current = null;
    }
    localStorage.setItem(ACTIVE_TRIP_KEY, id);
    setActiveTripId(id);
  };

  const clearActiveTrip = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      if (activeTripId && tripData) {
        setDoc(doc(db, 'trips', activeTripId), { ...tripData, updatedAt: serverTimestamp() });
      }
      saveTimeoutRef.current = null;
    }
    localStorage.removeItem(ACTIVE_TRIP_KEY);
    setActiveTripId(null);
    setTripData(null);
  };

  const deleteTrip = async (id) => {
    await deleteDoc(doc(db, 'trips', id));
    if (activeTripId === id) clearActiveTrip();
  };

  // --- Current trip CRUD ---
  const update = (partial) => {
    // Normalize tripName → name for backward compat
    const normalized = { ...partial };
    if ('tripName' in normalized) {
      normalized.name = normalized.tripName;
      delete normalized.tripName;
    }
    updateTripData({ ...tripData, ...normalized });
  };

  const addDay = (day) => {
    const newDay = { id: generateId(), ...day };
    updateTripData({ ...tripData, days: sortDays([...tripData.days, newDay]) });
    return newDay.id;
  };

  const updateDay = (id, changes) => {
    updateTripData({
      ...tripData,
      days: sortDays(tripData.days.map((d) => (d.id === id ? { ...d, ...changes } : d))),
    });
  };

  const deleteDay = (id) => {
    updateTripData({ ...tripData, days: tripData.days.filter((d) => d.id !== id) });
  };

  const addPlace = (place) => {
    const newPlace = { id: generateId(), ...place };
    updateTripData({ ...tripData, places: [...tripData.places, newPlace] });
    return newPlace.id;
  };

  const updatePlace = (id, changes) => {
    updateTripData({
      ...tripData,
      places: tripData.places.map((p) => (p.id === id ? { ...p, ...changes } : p)),
    });
  };

  const deletePlace = (id) => {
    updateTripData({
      ...tripData,
      places: tripData.places.filter((p) => p.id !== id),
      days: tripData.days.map((d) => ({
        ...d,
        accommodationId: d.accommodationId === id ? null : d.accommodationId,
        items: (d.items ?? []).filter((i) => !(i.type === 'place' && i.id === id)),
      })),
    });
  };

  // --- Import / Export ---
  const exportData = () => {
    const blob = new Blob([JSON.stringify(tripData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tripData?.name || 'trip'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (json) => {
    try {
      const parsed = JSON.parse(json);
      updateTripData(migrateData({ ...tripData, ...parsed }));
      return true;
    } catch { return false; }
  };

  // Legacy localStorage migration helper
  const getLegacyData = () => {
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed.days?.length && !parsed.places?.length) return null;
      return migrateData(parsed);
    } catch { return null; }
  };

  const clearLegacyData = () => localStorage.removeItem(LEGACY_KEY);

  return {
    // Trip list
    trips,
    activeTripId,
    loading: loading || tripsLoading,
    tripLoading: loading,

    // Trip management
    createTrip,
    switchTrip,
    clearActiveTrip,
    deleteTrip,
    getLegacyData,
    clearLegacyData,

    // Current trip data (spread for backward compat)
    ...(tripData ?? { name: '', language: 'he', days: [], places: [] }),
    tripName: tripData?.name ?? '',
    language: tripData?.language ?? 'he',

    // CRUD
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
