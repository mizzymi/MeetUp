import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setToken } from "@/lib/auth/token";

export function AuthCallback() {
    const [params] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = params.get("token");
        if (token) setToken(token);
        navigate("/", { replace: true });
    }, [params, navigate]);

    return <div className="p-6">Signing in…</div>;
}
