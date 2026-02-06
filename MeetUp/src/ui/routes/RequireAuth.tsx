import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthed } from "@/lib/is-authed";

/**
 * Private-route guard.
 * - While checking auth: shows a loading state
 * - If not authenticated: redirects to /login
 * - If authenticated: renders children
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [authed, setAuthed] = useState(false);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                const ok = await isAuthed();
                if (mounted) setAuthed(ok);
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    if (loading) return <div className="p-6">Loading…</div>;

    if (!authed) {
        return (
            <Navigate
                to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
                replace
            />
        );
    }

    return <>{children}</>;
}
