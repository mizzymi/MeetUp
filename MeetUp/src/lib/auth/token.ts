/**
 * JWT token helpers.
 * Keeping token logic in one place prevents "token/access_token/session" mismatches.
 */

const TOKEN_KEYS = ["token", "access_token", "session"] as const;

export function getToken(): string | null {
    for (const key of TOKEN_KEYS) {
        const value = localStorage.getItem(key);
        if (value && value.trim().length > 0) return value;
    }
    return null;
}

export function setToken(token: string) {
    localStorage.setItem("token", token);
}

export function clearToken() {
    for (const key of TOKEN_KEYS) localStorage.removeItem(key);
}
