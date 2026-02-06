import { Routes, Route, Navigate } from "react-router-dom";
import { Login } from "@/ui/pages/Login";
import { Privacy } from "@/ui/pages/Privacy";
import { Terms } from "@/ui/pages/Terms";
import { Home } from "@/ui/pages/Home";
import { RequireAuth } from "@/ui/routes/RequireAuth";
import { AuthCallback } from "@/ui/pages/AuthCallback";

export function AppRoutes() {
    return (
        <Routes>
            {/* PUBLIC */}
            <Route path="/login" element={<Login />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* PRIVATE */}
            <Route
                path="/"
                element={
                    <RequireAuth>
                        <Home />
                    </RequireAuth>
                }
            />

            {/* catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
