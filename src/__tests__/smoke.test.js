/**
 * Smoke tests — verify every component module can be imported without errors.
 *
 * These tests exist to catch the class of bug where a syntax or import-order
 * error prevents a module from loading at all (e.g. `import` after `const`).
 * Such errors are invisible during `vite build` (Vite transforms them) but
 * crash at runtime in the browser.  A bare dynamic import() here will throw
 * immediately, making the bug obvious in CI before any human opens the app.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — must come before any dynamic imports of the real modules
// ---------------------------------------------------------------------------

// Firebase — uses import.meta.env which is unavailable in the test runner
vi.mock('../firebase', () => ({
  db:   {},
  auth: { currentUser: null },
}));

// firebase/firestore — used by store.js
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  serverTimestamp: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  arrayUnion: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(() => vi.fn()),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: class {},
  signOut: vi.fn(),
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

// @dnd-kit — uses PointerEvent / browser APIs not available in jsdom
vi.mock('@dnd-kit/core', () => ({
  DndContext:       ({ children }) => children,
  closestCenter:    vi.fn(),
  PointerSensor:    class PointerSensor {},
  useSensor:        vi.fn(() => null),
  useSensors:       vi.fn(() => []),
  DragOverlay:      () => null,
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext:          ({ children }) => children,
  verticalListSortingStrategy: vi.fn(),
  useSortable: vi.fn(() => ({
    attributes: {}, listeners: {}, setNodeRef: vi.fn(),
    transform: null, transition: null, isDragging: false, isOver: false,
  })),
  arrayMove: vi.fn((arr) => arr),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: vi.fn(() => '') } },
}));

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
async function importComponent(path) {
  const mod = await import(path);
  return mod;
}

// ---------------------------------------------------------------------------
// Smoke tests
// ---------------------------------------------------------------------------
describe('Component module smoke tests', () => {
  const components = [
    ['DayEditModal',       '../components/DayEditModal'],
    ['PlaceEditModal',     '../components/PlaceEditModal'],
    ['PlaceDetailModal',   '../components/PlaceDetailModal'],
    ['ItineraryView',      '../components/ItineraryView'],
    ['PlacesView',         '../components/PlacesView'],
    ['DayInsightsPanel',   '../components/DayInsightsPanel'],
    ['BuiltinCalculator',  '../components/BuiltinCalculator'],
    ['Header',             '../components/Header'],
    ['TripSelector',       '../components/TripSelector'],
    ['SettingsModal',      '../components/SettingsModal'],
    ['LoginScreen',        '../components/LoginScreen'],
    ['FaqModal',           '../components/FaqModal'],
    ['CoverPhotoPicker',   '../components/CoverPhotoPicker'],
  ];

  for (const [name, path] of components) {
    it(`${name} — imports successfully and exports a function`, async () => {
      const mod = await importComponent(path);
      expect(typeof mod.default, `${name} default export should be a function`).toBe('function');
    });
  }
});

describe('Utility module smoke tests', () => {
  it('i18n — exports TRANSLATIONS and useT', async () => {
    const { default: TRANSLATIONS, useT } = await import('../i18n');
    expect(typeof useT).toBe('function');
    expect(TRANSLATIONS).toHaveProperty('he');
    expect(TRANSLATIONS).toHaveProperty('en');
  });

  it('routeApi — exports parseGoogleMapsUrl and photonSearch', async () => {
    const mod = await import('../routeApi');
    expect(typeof mod.parseGoogleMapsUrl).toBe('function');
    expect(typeof mod.photonSearch).toBe('function');
  });

  it('wikiImages — exports searchWikiImages', async () => {
    const mod = await import('../wikiImages');
    expect(typeof mod.searchWikiImages).toBe('function');
  });

  it('permissions — exports getRole and canEdit', async () => {
    const mod = await import('../permissions');
    expect(typeof mod.getRole).toBe('function');
    expect(typeof mod.canEdit).toBe('function');
  });
});
