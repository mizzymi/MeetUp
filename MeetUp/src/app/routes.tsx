import { Routes, Route, Navigate } from "react-router-dom";
import { Login } from "@/ui/pages/Login";
import { Privacy } from "@/ui/pages/Privacy";
import { Terms } from "@/ui/pages/Terms";
import { Home } from "@/ui/pages/Home";

export function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
