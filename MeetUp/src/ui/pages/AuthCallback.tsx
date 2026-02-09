import { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { setTokenForUser, setActiveUser } from "@/lib/auth/token";

type LocationState = { from?: string };

function decodeJwtPayload(token: string): any | null {
    try {
        const part = token.split(".")[1];
        if (!part) return null;
        const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
        return JSON.parse(json);
    } catch {
        return null;
    }
}

export function AuthCallback() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const token = params.get("token");

        if (token) {
            const payload = decodeJwtPayload(token);
            
            const uid = payload?.sub ?? payload?.userId ?? payload?.uid ?? payload?.email;

            if (uid) {
                setTokenForUser(String(uid), token);
                setActiveUser(String(uid));
            } else {
            }
        }

        const fromState = (location.state as LocationState | null)?.from;
        const next = params.get("next");

        const target = (fromState || next || "/").trim();
        navigate(target.startsWith("/") ? target : "/", { replace: true });
    }, [params, navigate, location.state]);

    return <div className="p-6">Signing in…</div>;
}
