import { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";

export function useMeetRoomId() {
    const { roomId: roomIdParam } = useParams<{ roomId?: string }>();
    const location = useLocation();

    return useMemo(() => {
        const fromParam = (roomIdParam ?? "").trim();
        if (fromParam) return fromParam;

        const hash = window.location.hash || ""; 
        const path = (location.pathname || "").trim();

        const candidate = path && path !== "/" ? path : hash.replace(/^#/, "");

        if (candidate.startsWith("/meetup-")) return candidate.slice("/meetup-".length).trim();
        if (candidate.startsWith("/meet/")) return candidate.slice("/meet/".length).trim();

        return "";
    }, [roomIdParam, location.pathname]);
}
