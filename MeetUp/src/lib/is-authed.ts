import { Api } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth/token";
import { ApiError } from "@/lib/api/client";

/**
 * Server-validated auth check.
 * - A token in storage is not enough (it can be expired/invalid).
 * - This calls GET /me and trusts the backend as the source of truth.
 */
export async function isAuthed(): Promise<boolean> {
  const token = getToken();

  if (!token) return false;

  try {
    const me = await Api.me();
    return Boolean(me?.authenticated ?? true);
  } catch (e) {

    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      clearToken();
    }

    return false;
  }
}
