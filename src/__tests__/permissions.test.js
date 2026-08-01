import { describe, it, expect } from 'vitest';
import { getRole, canEdit } from '../permissions';

const ADMIN = 'uid-admin-001';
const GUEST = 'uid-guest-002';
const OTHER = 'uid-stranger-003';

const trip = {
  members: [ADMIN],
  guests:  [GUEST],
  ownerId: ADMIN,
};

// ---------------------------------------------------------------------------
// getRole
// ---------------------------------------------------------------------------
describe('getRole', () => {
  it('returns "admin" for a member', () => {
    expect(getRole(trip, ADMIN)).toBe('admin');
  });

  it('returns "guest" for a guest user', () => {
    expect(getRole(trip, GUEST)).toBe('guest');
  });

  it('returns null for a stranger', () => {
    expect(getRole(trip, OTHER)).toBeNull();
  });

  it('returns null when uid is null', () => {
    expect(getRole(trip, null)).toBeNull();
  });

  it('returns null when uid is undefined', () => {
    expect(getRole(trip, undefined)).toBeNull();
  });

  it('returns null when tripData is null', () => {
    expect(getRole(null, ADMIN)).toBeNull();
  });

  it('handles trip with no guests field', () => {
    const tripNoGuests = { members: [ADMIN] };
    expect(getRole(tripNoGuests, ADMIN)).toBe('admin');
    expect(getRole(tripNoGuests, GUEST)).toBeNull();
  });

  it('handles trip with empty members and guests', () => {
    expect(getRole({ members: [], guests: [] }, ADMIN)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// canEdit
// ---------------------------------------------------------------------------
describe('canEdit', () => {
  it('allows admin (member) to edit', () => {
    expect(canEdit(trip, ADMIN)).toBe(true);
  });

  it('blocks guest from editing', () => {
    expect(canEdit(trip, GUEST)).toBe(false);
  });

  it('blocks stranger from editing', () => {
    expect(canEdit(trip, OTHER)).toBe(false);
  });

  it('blocks null uid', () => {
    expect(canEdit(trip, null)).toBe(false);
  });

  it('blocks when tripData is null', () => {
    expect(canEdit(null, ADMIN)).toBe(false);
  });

  it('trip owner is always an admin (member)', () => {
    const fresh = { members: [ADMIN], guests: [], ownerId: ADMIN };
    expect(canEdit(fresh, ADMIN)).toBe(true);
  });

  it('guest cannot edit even if ownerId matches', () => {
    // Pathological: ownerId set but user is only in guests — members wins
    const weird = { members: [], guests: [GUEST], ownerId: GUEST };
    expect(canEdit(weird, GUEST)).toBe(false);
  });

  it('multiple admins — all can edit', () => {
    const ADMIN2 = 'uid-admin-004';
    const multiAdmin = { members: [ADMIN, ADMIN2], guests: [GUEST] };
    expect(canEdit(multiAdmin, ADMIN)).toBe(true);
    expect(canEdit(multiAdmin, ADMIN2)).toBe(true);
    expect(canEdit(multiAdmin, GUEST)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Sharing model invariants
// ---------------------------------------------------------------------------
describe('sharing model invariants', () => {
  it('a user in both members and guests is treated as admin', () => {
    // members takes priority because getRole checks members first
    const overlap = { members: [ADMIN], guests: [ADMIN] };
    expect(getRole(overlap, ADMIN)).toBe('admin');
    expect(canEdit(overlap, ADMIN)).toBe(true);
  });

  it('guest invitation does not grant edit access', () => {
    const guestTrip = { members: [ADMIN], guests: [GUEST] };
    expect(canEdit(guestTrip, GUEST)).toBe(false);
    expect(getRole(guestTrip, GUEST)).toBe('guest');
  });

  it('admin invitation grants edit access', () => {
    const adminTrip = { members: [ADMIN, OTHER], guests: [] };
    expect(canEdit(adminTrip, OTHER)).toBe(true);
  });
});
