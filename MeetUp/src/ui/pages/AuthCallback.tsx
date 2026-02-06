import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setToken } from "@/lib/auth/token";

/**
 * AuthCallback
 * -----------
 * Public page used as OAuth return target:
 *   /#/auth/callback?token=...
 *
 * Responsibilities:
 * - Persist the JWT in localStorage
 * - Redirect the user to the app home route ("/")
 *
 * Note (Electron + HashRouter):
 * - The backend must redirect to "/#/auth/callback?token=..."
 */
export function AuthCallback() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const token = useMemo(() => params.get("token"), [params]);
    const [status, setStatus] = useState<"loading" | "error">("loading");

    useEffect(() => {
        const t = window.setTimeout(() => {
            if (token && token.trim().length > 0) {
                setToken(token);
                navigate("/", { replace: true });
                return;
            }

            setStatus("error");
            navigate("/login", { replace: true });
        }, 200);

        return () => window.clearTimeout(t);
    }, [navigate, token]);

    return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start gap-3">
                        {status === "loading" ? (
                            <div className="mt-1 h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
                        ) : (
                            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600">
                                !
                            </div>
                        )}

                        <div className="flex-1">
                            <h1 className="text-lg font-semibold text-zinc-900">
                                {status === "loading" ? "Finishing sign-in" : "Sign-in failed"}
                            </h1>
                            <p className="mt-1 text-sm text-zinc-600">
                                {status === "loading"
                                    ? "Saving your session and opening the app…"
                                    : "We didn’t receive a valid token. Please try again."}
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 rounded-xl bg-zinc-50 p-4">
                        <p className="text-xs font-medium text-zinc-700">What’s happening</p>
                        <ul className="mt-2 space-y-1 text-sm text-zinc-600">
                            <li>• Persist token</li>
                            <li>• Validate with the server</li>
                            <li>• Redirect to Home</li>
                        </ul>
                    </div>
                </div>

                <p className="mt-6 text-center text-xs text-zinc-400">
                    MeetUp · Secure authentication
                </p>
            </div>
        </div>
    );
}
