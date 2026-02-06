import { isAuthed } from "@/lib/is-authed";
import { PageHeaderClient } from "./page-header.client";

/**
 * Props for {@link PageHeader}.
 */
type PageHeaderProps = {
  /**
   * Title displayed in the header (right side).
   * @defaultValue "Meet Up"
   */
  title?: string;

  /**
   * Explicit back URL. If provided, it will be used as the navigation fallback.
   * If omitted, `resolvedBack` will be computed based on the user's auth state:
   * - authed  -> `fallbackAuthed`
   * - guest   -> `fallbackGuest`
   */
  backHref?: string;

  /**
   * Back URL fallback when the user is authenticated and `backHref` is not provided.
   * @defaultValue "/app"
   */
  fallbackAuthed?: string;

  /**
   * Back URL fallback when the user is not authenticated and `backHref` is not provided.
   * @defaultValue "/login"
   */
  fallbackGuest?: string;

  /**
   * If `true`, the client component will prefer using browser history (`router.back()`)
   * when there is enough history available, otherwise it will `push(backHref)`.
   * @defaultValue true
   */
  preferHistoryBack?: boolean;

  /**
   * If `true`, the client component will always navigate to `backHref` using `router.push`,
   * ignoring browser history.
   *
   * Useful for deterministic "back" behavior (e.g., when the user may have arrived from
   * an external link or you don't want them to return to a previous unrelated page).
   * @defaultValue false
   */
  forceBackHref?: boolean;
};

/**
 * Server component wrapper for {@link PageHeaderClient}.
 *
 * This component resolves the `backHref` on the server:
 * - If `backHref` is provided, it uses that.
 * - Otherwise, it checks authentication via {@link isAuthed} and picks:
 *   - `fallbackAuthed` when authenticated
 *   - `fallbackGuest` when not authenticated
 *
 * Then it renders the client header component, which handles the actual navigation behavior
 * (history back vs push) depending on `preferHistoryBack` and `forceBackHref`.
 */
export async function PageHeader({
  title = "Meet Up",
  backHref,
  fallbackAuthed = "/app",
  fallbackGuest = "/login",
  preferHistoryBack = true,
  forceBackHref = false,
}: PageHeaderProps) {
  /**
   * Final back URL used by the client header.
   * Priority:
   * 1) `backHref` if explicitly provided
   * 2) `fallbackAuthed` if authenticated
   * 3) `fallbackGuest` otherwise
   */
  const resolvedBack = backHref ?? ((await isAuthed()) ? fallbackAuthed : fallbackGuest);

  return (
    <PageHeaderClient
      title={title}
      backHref={resolvedBack}
      preferHistoryBack={preferHistoryBack}
      forceBackHref={forceBackHref}
    />
  );
}
