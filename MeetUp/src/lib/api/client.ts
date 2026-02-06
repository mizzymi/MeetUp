import { clearToken, getToken } from "@/lib/auth/token";

/**
 * Backend base URL.
 * - Dev example: http://localhost:8080
 * - Production: set VITE_API_BASE in your environment.
 */
export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

/**
 * Typed error used by the API client.
 * Allows the UI to react differently to 401/403 vs other errors.
 */
export class ApiError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Parses JSON responses safely.
 * - 204 No Content -> returns null
 * - 200 with empty body -> returns null
 * - Otherwise -> JSON.parse(body)
 */
async function safeJson<T>(res: Response): Promise<T> {
  if (res.status === 204) return null as T;

  const text = await res.text();
  if (!text || text.trim().length === 0) return null as T;

  return JSON.parse(text) as T;
}

/**
 * Builds default headers for authenticated requests.
 * Throws 401 if token is missing, so callers can treat it as unauthenticated.
 */
function authHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) throw new ApiError("NO_TOKEN", 401);

  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * GET JSON with Bearer auth.
 * Clears token on 401/403 (server says session is invalid).
 */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: {
      ...authHeaders(),
    },
  });

  if (res.status === 401 || res.status === 403) {
    throw new ApiError("UNAUTHORIZED", res.status);
  }

  if (!res.ok) {
    throw new ApiError(`HTTP_${res.status}`, res.status);
  }

  return safeJson<T>(res);
}

/**
 * POST JSON with Bearer auth.
 * Clears token on 401/403 (server says session is invalid).
 */
export async function apiPost<TResponse, TBody>(
  path: string,
  body: TBody
): Promise<TResponse> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401 || res.status === 403) {
    throw new ApiError("UNAUTHORIZED", res.status);
  }

  if (!res.ok) {
    throw new ApiError(`HTTP_${res.status}`, res.status);
  }

  return safeJson<TResponse>(res);
}

export async function apiDel<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: {
      ...authHeaders(),
    },
  });

  if (res.status === 401 || res.status === 403) {
    throw new ApiError("UNAUTHORIZED", res.status);
  }

  if (!res.ok) {
    throw new ApiError(`HTTP_${res.status}`, res.status);
  }

  return safeJson<T>(res);
}

export async function apiPut<TResponse, TBody>(path: string, body: TBody): Promise<TResponse> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 401 || res.status === 403) {
    clearToken();
    throw new ApiError("UNAUTHORIZED", res.status);
  }
  if (!res.ok) throw new ApiError(`HTTP_${res.status}`, res.status);

  return safeJson<TResponse>(res);
}
