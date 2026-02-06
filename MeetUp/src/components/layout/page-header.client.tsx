import * as React from "react";
import { useNavigate } from "react-router-dom";

/**
 * Props for {@link PageHeaderClient}.
 */
type PageHeaderClientProps = {
    /**
     * Title displayed on the right side of the header.
     * @defaultValue "Meet Up"
     */
    title?: string;

    /**
     * Human-friendly destination label shown in the "back" button text:
     * `← Volver a {returnTo}`.
     *
     * Note: this does **not** control navigation. Navigation is controlled by `backHref`.
     * @defaultValue "login"
     */
    returnTo?: string;

    /**
     * Fallback URL used when we can't (or shouldn't) navigate back using browser history.
     *
     * Examples:
     * - "/login"
     * - "/dashboard"
     */
    backHref: string;

    /**
     * If `true`, the component will try to go back using browser history when available.
     * @defaultValue true
     */
    preferHistoryBack?: boolean;

    /**
     * If `true`, always navigate using `backHref`, ignoring history.
     * @defaultValue false
     */
    forceBackHref?: boolean;
};

/**
 * Client-side page header with a back button and a title (React Router version).
 *
 * ## Navigation behavior (priority order)
 * 1) If `forceBackHref` is `true` → navigate(backHref)
 * 2) Else if `preferHistoryBack` is `true` and there is browser history (`window.history.length > 1`)
 *    → window.history.back()
 * 3) Else → navigate(backHref)
 */
export function PageHeaderClient({
    title = "Meet Up",
    returnTo = "login",
    backHref,
    preferHistoryBack = true,
    forceBackHref = false,
}: PageHeaderClientProps) {
    const navigate = useNavigate();

    const onBack = React.useCallback(() => {
        if (forceBackHref) {
            navigate(backHref);
            return;
        }

        if (preferHistoryBack && window.history.length > 1) {
            // En React Router no hay "router.back()" como en Next.
            // La forma más fiel es usar el historial del navegador:
            window.history.back();
            return;
        }

        navigate(backHref);
    }, [forceBackHref, preferHistoryBack, backHref, navigate]);

    return (
        <div className="mb-4 flex items-center justify-between">
            <button
                type="button"
                onClick={onBack}
                className="text-sm text-slate-600 hover:text-slate-900"
                aria-label={`Volver a ${returnTo}`}
            >
                ← Volver a {returnTo}
            </button>

            <span className="text-sm font-semibold text-slate-900">{title}</span>
        </div>
    );
}
