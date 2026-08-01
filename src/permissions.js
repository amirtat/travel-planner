/**
 * Pure permission logic — no Firebase or React dependencies.
 * Testable in isolation.
 */

/** @returns {'admin' | 'guest' | null} */
export function getRole(tripData, uid) {
  if (!uid || !tripData) return null;
  if ((tripData.members ?? []).includes(uid)) return 'admin';
  if ((tripData.guests  ?? []).includes(uid)) return 'guest';
  return null;
}

/** true if the user can write (admin member) */
export function canEdit(tripData, uid) {
  return getRole(tripData, uid) === 'admin';
}
