/**
 * JWT token helpers.
 * Keeping token logic in one place prevents "token/access_token/session" mismatches.
 */
const KEY = "meetup:token";

export function setToken(token: string) {
  localStorage.setItem(KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(KEY);
}

export function clearToken() {
  localStorage.removeItem(KEY);
}

