/**
 * UI formatting helpers.
 * Keeping formatting outside components reduces noise and re-renders.
 */

function pad2(n: number) {
    return n.toString().padStart(2, "0");
}

/** ISO string -> "HH:mm" in the user's local time zone */
export function formatTime(iso: string): string {
    const d = new Date(iso);
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Returns a readable duration label ("1h", "45min", "1h 15min") */
export function durationLabel(startsAt: string, endsAt: string): string {
    const ms = new Date(endsAt).getTime() - new Date(startsAt).getTime();
    const mins = Math.max(0, Math.round(ms / 60000));
    const h = Math.floor(mins / 60);
    const m = mins % 60;

    if (h <= 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
}
