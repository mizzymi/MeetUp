import { Api } from "@/lib/api";
import { getToken, clearActiveToken } from "@/lib/auth/token";
import { ApiError } from "@/lib/api/client";

/**
 * Server-validated auth check (active user).
 * - A token in storage is not enough (it can be expired/invalid).
 * - This calls GET /me and trusts the backend as the source of truth.
 */
export async function isAuthed(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  try {
    const me = await Api.me();
    // If backend doesn't provide "authenticated", treat a valid /me as authenticated.
    return Boolean((me as any)?.authenticated ?? true);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      clearActiveToken();
    }
    return false;
  }
}
