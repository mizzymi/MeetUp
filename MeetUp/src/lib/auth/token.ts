/**
 * Token helpers (multi-user + active user).
 */

const PREFIX = "meetup:token:";
const ACTIVE_KEY = "meetup:activeUser";

export function setActiveUser(userId: string) {
  localStorage.setItem(ACTIVE_KEY, userId);
}

export function getActiveUser(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function setTokenForUser(userId: string, token: string) {
  localStorage.setItem(PREFIX + userId, token);
  setActiveUser(userId);
}

export function getToken(): string | null {
  const userId = getActiveUser();
  if (!userId) return null;
  return localStorage.getItem(PREFIX + userId);
}

export function clearActiveToken() {
  const userId = getActiveUser();
  if (!userId) return;
  localStorage.removeItem(PREFIX + userId);
  localStorage.removeItem(ACTIVE_KEY);
}

export function clearTokenForUser(userId: string) {
  localStorage.removeItem(PREFIX + userId);
  if (getActiveUser() === userId) {
    localStorage.removeItem(ACTIVE_KEY);
  }
}
