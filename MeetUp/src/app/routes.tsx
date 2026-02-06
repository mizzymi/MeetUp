import { Routes, Route, Outlet } from "react-router-dom";
import { Login } from "@/ui/pages/Login";
import { Privacy } from "@/ui/pages/Privacy";
import { Terms } from "@/ui/pages/Terms";
import { Home } from "@/ui/pages/Home";
import { RequireAuth } from "@/ui/routes/RequireAuth";
import { AuthCallback } from "@/ui/pages/AuthCallback";
import { MeetRoomPage } from "@/ui/pages/MeetRoom";

function ProtectedLayout() {
    return (
        <RequireAuth>
            <Outlet />
        </RequireAuth>
    );
}

function NotFound() {
    return (
        <div className="p-6">
            <div className="text-lg font-semibold">404</div>
            <div className="mt-2 text-sm opacity-70">
                {window.location.pathname}
                {window.location.search}
            </div>
        </div>
    );
}

export function AppRoutes() {
    return (
        <Routes>
            {/* PUBLIC */}
            <Route path="/login" element={<Login />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* ✅ ROOT PRIVATE (explícito) */}
            <Route path="/" element={<ProtectedLayout />}>
                <Route index element={<Home />} />
                <Route path="/meet/:roomId" element={<MeetRoomPage />} />
                <Route path="/__ping" element={<div style={{ padding: 24 }}>PING OK</div>} />

            </Route>

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
