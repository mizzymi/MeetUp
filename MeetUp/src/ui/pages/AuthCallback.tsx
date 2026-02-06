import { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { setToken } from "@/lib/auth/token";

type LocationState = { from?: string };

export function AuthCallback() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const token = params.get("token");
        if (token) setToken(token);

        const fromState = (location.state as LocationState | null)?.from;
        const next = params.get("next");

        const target = (fromState || next || "/").trim();
        navigate(target.startsWith("/") ? target : "/", { replace: true });
    }, [params, navigate, location.state]);

    return <div className="p-6">Signing in…</div>;
}
