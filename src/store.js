import { useState, useEffect, useRef, useCallback } from 'react';
import { db, auth } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  arrayUnion,
} from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
} from 'firebase/auth';
import { canEdit } from './permissions';

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

function tripFromDoc(d) {
  const data = d.data();
  return {
    id: d.id,
    name: data.name ?? data.tripName ?? 'ללא שם',
    language: data.language ?? 'he',
    createdAt: data.createdAt,
    shareToken: data.shareToken ?? null,
    guestToken: data.guestToken ?? null,
    members: data.members ?? [],
    guests: data.guests ?? [],
    ownerId: data.ownerId ?? null,
  };
}

function mergeTrips(memberList, guestList) {
  const map = new Map();
  [...memberList, ...guestList].forEach((t) => map.set(t.id, t));
  return [...map.values()].sort(
    (a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0)
  );
}

export function useTravelStore() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Trip state
  const [trips, setTrips] = useState([]);
  const [activeTripId, setActiveTripId] = useState(
    () => localStorage.getItem(ACTIVE_TRIP_KEY) || null
  );
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tripsLoading, setTripsLoading] = useState(true);
  const saveTimeoutRef = useRef(null);

  // Track both queries for merging
  const memberTripsRef = useRef([]);
  const guestTripsRef  = useRef([]);

  // Auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Real-time trips list — two queries: member + guest
  useEffect(() => {
    if (!user) {
      setTrips([]);
      setTripsLoading(false);
      return;
    }

    // One-time migration: add members field to old trips that don't have it
    const migrationKey = `auth-migrated-${user.uid}`;
    if (!localStorage.getItem(migrationKey)) {
      getDocs(collection(db, 'trips')).then((snap) => {
        const toMigrate = snap.docs.filter((d) => !d.data().members);
        return Promise.all(
          toMigrate.map((d) =>
            updateDoc(doc(db, 'trips', d.id), {
              members: [user.uid],
              ownerId: user.uid,
            })
          )
        );
      }).then(() => {
        localStorage.setItem(migrationKey, '1');
      }).catch(console.error);
    }

    setTripsLoading(true);
    let loaded = 0;
    const onBothLoaded = () => { if (++loaded >= 2) setTripsLoading(false); };

    const q1 = query(collection(db, 'trips'), where('members', 'array-contains', user.uid));
    const unsub1 = onSnapshot(q1, (snap) => {
      memberTripsRef.current = snap.docs.map(tripFromDoc);
      setTrips(mergeTrips(memberTripsRef.current, guestTripsRef.current));
      onBothLoaded();
    });

    const q2 = query(collection(db, 'trips'), where('guests', 'array-contains', user.uid));
    const unsub2 = onSnapshot(q2, (snap) => {
      guestTripsRef.current = snap.docs.map(tripFromDoc);
      setTrips(mergeTrips(memberTripsRef.current, guestTripsRef.current));
      onBothLoaded();
    });

    return () => { unsub1(); unsub2(); };
  }, [user?.uid]);

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

  // --- Auth ---
  const signIn = () => signInWithPopup(auth, new GoogleAuthProvider());
  const signOut = () => fbSignOut(auth);

  // --- Trip management ---
  const createTrip = async (name, language = 'he', initialData = null) => {
    const id = generateId();
    const base = { name, language, days: [], places: [] };
    const newTrip = {
      ...base,
      ...(initialData ? migrateData(initialData) : {}),
      name,
      language,
      ownerId: user?.uid ?? null,
      members: user?.uid ? [user.uid] : [],
      guests: [],
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

  // --- Share / Join (admin) ---
  const generateShareToken = async (tripId) => {
    const token = generateId();
    await updateDoc(doc(db, 'trips', tripId), { shareToken: token });
    return token;
  };

  const joinTripByToken = async (token) => {
    if (!user) throw new Error('Not authenticated');
    const q = query(collection(db, 'trips'), where('shareToken', '==', token));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Trip not found');
    const tripDoc = snap.docs[0];
    if (!(tripDoc.data().members ?? []).includes(user.uid)) {
      await updateDoc(doc(db, 'trips', tripDoc.id), { members: arrayUnion(user.uid) });
    }
    return tripDoc.id;
  };

  // --- Share / Join (guest) ---
  const generateGuestToken = async (tripId) => {
    const token = generateId();
    await updateDoc(doc(db, 'trips', tripId), { guestToken: token });
    return token;
  };

  const joinTripAsGuest = async (token) => {
    if (!user) throw new Error('Not authenticated');
    const q = query(collection(db, 'trips'), where('guestToken', '==', token));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Trip not found');
    const tripDoc = snap.docs[0];
    const data = tripDoc.data();
    // Upgrade to member if already a member
    if ((data.members ?? []).includes(user.uid)) return tripDoc.id;
    if (!(data.guests ?? []).includes(user.uid)) {
      await updateDoc(doc(db, 'trips', tripDoc.id), { guests: arrayUnion(user.uid) });
    }
    return tripDoc.id;
  };

  // --- Permission helpers ---
  const isReadOnly = tripData && user ? !canEdit(tripData, user.uid) : false;

  // --- Current trip CRUD ---
  const update = (partial) => {
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

  const CONTENT_FIELDS = ['items', 'accommodationId', 'accommodationName', 'region', 'notes', 'freeCancellation'];
  const swapDayContent = (id1, id2) => {
    const d1 = tripData.days.find((d) => d.id === id1);
    const d2 = tripData.days.find((d) => d.id === id2);
    if (!d1 || !d2) return;
    const pick = (src) => Object.fromEntries(CONTENT_FIELDS.map((k) => [k, src[k]]));
    const newDays = tripData.days.map((d) => {
      if (d.id === id1) return { ...d, ...pick(d2) };
      if (d.id === id2) return { ...d, ...pick(d1) };
      return d;
    });
    updateTripData({ ...tripData, days: newDays });
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
    // Auth
    user,
    authLoading,
    signIn,
    signOut,

    // Trip list
    trips,
    activeTripId,
    loading: loading || tripsLoading,
    tripLoading: loading,

    // Permissions
    isReadOnly,

    // Trip management
    createTrip,
    switchTrip,
    clearActiveTrip,
    deleteTrip,
    getLegacyData,
    clearLegacyData,

    // Share / Join
    generateShareToken,
    joinTripByToken,
    generateGuestToken,
    joinTripAsGuest,

    // Current trip data (spread for backward compat)
    ...(tripData ?? { name: '', language: 'he', days: [], places: [] }),
    tripName: tripData?.name ?? '',
    language: tripData?.language ?? 'he',

    // CRUD
    update,
    addDay,
    updateDay,
    deleteDay,
    swapDayContent,
    addPlace,
    updatePlace,
    deletePlace,
    exportData,
    importData,
  };
}
