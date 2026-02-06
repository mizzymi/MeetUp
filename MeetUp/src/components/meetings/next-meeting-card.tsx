import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button/button";
import { Clock, User2, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

/**
 * Data model for the "Next meeting" hero card.
 *
 * Notes:
 * - Prefer providing `startsAt` as a real datetime (Date or ISO string).
 * - If you only have `startsAtLabel` ("HH:mm"), it will be interpreted as TODAY
 *   in the user's local timezone.
 */
export type NextMeeting = {
    /** Meeting title. */
    title: string;

    /**
     * Start datetime.
     * - Date: `new Date(...)`
     * - ISO string: `"2026-02-06T14:30:00"`
     *
     * If omitted, `startsAtLabel` ("HH:mm") is used as a fallback (today).
     */
    startsAt?: Date | string;

    /**
     * Human label shown in the UI (e.g. "14:30").
     * Also used as fallback to resolve the actual Date (today) when `startsAt` is not provided.
     */
    startsAtLabel: string;

    /** End time label shown in the UI (e.g. "15:30"). */
    endsAtLabel: string;

    /** Host / organizer name. */
    hostName: string;

    /** Optional description below metadata. */
    description?: string;

    /**
     * Optional override for the badge text.
     * If omitted, the badge will be computed from the meeting start time.
     */
    inLabel?: string;

    /** Called when user clicks "Entrar". */
    onEnter?: () => void;
};

/**
 * Props for {@link NextMeetingCard}.
 */
type NextMeetingCardProps = {
    meeting: NextMeeting;
    className?: string;

    /**
     * Base refresh interval (seconds) for the countdown badge.
     * The component may temporarily refresh more frequently when the meeting is close.
     * @defaultValue 30
     */
    tickSeconds?: number;

    /**
     * When meeting has started, keep showing a badge ("En curso") instead of hiding it.
     * @defaultValue true
     */
    showStartedBadge?: boolean;

    /**
     * When meeting is close (<= this many minutes), refresh every second for smoother UX.
     * @defaultValue 2
     */
    fastRefreshThresholdMinutes?: number;
};

/**
 * "Next meeting" hero card with computed "time until start" badge.
 *
 * Behavior:
 * - If `meeting.inLabel` exists → use it (manual override).
 * - Else compute badge from `meeting.startsAt` (Date/ISO) or from `meeting.startsAtLabel` (today).
 * - Badge updates on an interval:
 *   - Default: every `tickSeconds`
 *   - When meeting is near (<= `fastRefreshThresholdMinutes`): every 1s
 *   - When started: every 10s (cheap refresh)
 */
export function NextMeetingCard({
    meeting,
    className,
    tickSeconds = 30,
    showStartedBadge = true,
    fastRefreshThresholdMinutes = 2,
}: NextMeetingCardProps) {
    /**
     * Current time snapshot used to compute the countdown label.
     * Updated by interval based on proximity to start time.
     */
    const [now, setNow] = useState<Date>(() => new Date());

    /**
     * Resolve the meeting start datetime once from props.
     * - If `startsAt` provided: uses it
     * - Else: parses `startsAtLabel` as today's time
     */
    const start = useMemo(
        () => resolveStartDate(meeting.startsAt, meeting.startsAtLabel),
        [meeting.startsAt, meeting.startsAtLabel]
    );

    /**
     * Time left until meeting start in ms.
     * Negative / 0 means it already started.
     */
    const msLeft = start ? start.getTime() - now.getTime() : null;

    /**
     * Effective refresh interval:
     * - If meeting is very close → 1s
     * - If started → 10s
     * - Else → tickSeconds
     *
     * This value changes over time (because `msLeft` changes),
     * which causes the interval effect to re-bind with the new cadence.
     */
    const effectiveTickSeconds = useMemo(() => {
        if (msLeft == null) return tickSeconds;

        if (msLeft <= 0) return 10;

        const thresholdMs = fastRefreshThresholdMinutes * 60 * 1000;
        if (msLeft <= thresholdMs) return 1;

        return tickSeconds;
    }, [msLeft, tickSeconds, fastRefreshThresholdMinutes]);

    /**
     * Interval that updates "now" to trigger recomputation of the badge.
     * Depends on `effectiveTickSeconds` to adapt refresh cadence.
     */
    useEffect(() => {
        const id = window.setInterval(() => setNow(new Date()), effectiveTickSeconds * 1000);
        return () => window.clearInterval(id);
    }, [effectiveTickSeconds]);

    /**
     * Badge label:
     * - manual override via `meeting.inLabel`
     * - computed from `start` and `now`
     */
    const computedInLabel = useMemo(() => {
        if (meeting.inLabel) return meeting.inLabel;
        if (!start) return undefined;

        return formatTimeUntil(start, now, { showStartedBadge });
    }, [meeting.inLabel, start, now, showStartedBadge]);

    return (
        <div
            className={cn(
                "rounded-2xl border border-slate-200 bg-linear-125 from-emerald-100 to-purple-100 p-5 shadow-sm",
                className
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                    {computedInLabel ? (
                        <span className="inline-flex rounded-md bg-emerald-200 px-3 py-1 text-sm font-medium text-slate-900">
                            {computedInLabel}
                        </span>
                    ) : null}

                    <div className="space-y-1">
                        <h3 className="text-2xl font-semibold text-slate-900">{meeting.title}</h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-700">
                            <span className="inline-flex items-center gap-2">
                                <Clock className="h-4 w-4 text-sky-500" />
                                {meeting.startsAtLabel} - {meeting.endsAtLabel}
                            </span>

                            <span className="inline-flex items-center gap-2">
                                <User2 className="h-4 w-4 text-sky-500" />
                                {meeting.hostName}
                            </span>
                        </div>
                    </div>

                    {meeting.description ? (
                        <p className="text-sm text-slate-600">{meeting.description}</p>
                    ) : null}
                </div>

                <Button
                    type="button"
                    intent="primary"
                    size="md"
                    rightIcon={ArrowRight}
                    onClick={meeting.onEnter}
                    className="shrink-0"
                >
                    Entrar
                </Button>
            </div>
        </div>
    );
}

/**
 * Resolves a start Date from either:
 * - `startsAt` (Date or ISO string)
 * - `startsAtLabel` ("HH:mm") interpreted as today in local time
 *
 * Returns null if it cannot parse.
 */
function resolveStartDate(startsAt?: Date | string, startsAtLabel?: string): Date | null {
    if (startsAt instanceof Date) return startsAt;

    if (typeof startsAt === "string") {
        const d = new Date(startsAt);
        return isNaN(d.getTime()) ? null : d;
    }

    if (startsAtLabel) {
        const m = /^(\d{1,2}):(\d{2})$/.exec(startsAtLabel.trim());
        if (!m) return null;

        const hh = Number(m[1]);
        const mm = Number(m[2]);
        if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
        if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;

        const base = new Date();
        const d = new Date(base);
        d.setHours(hh, mm, 0, 0);
        return d;
    }

    return null;
}

/**
 * Computes a human label like:
 * - "En 15 minutos"
 * - "En 2 horas"
 * - "En 1 día"
 * - "En curso" (when started) if enabled
 *
 * Uses `Math.ceil` to avoid jumping to lower numbers too early.
 */
function formatTimeUntil(
    start: Date,
    now: Date,
    opts: { showStartedBadge: boolean }
): string | undefined {
    const diffMs = start.getTime() - now.getTime();

    if (diffMs <= 0) {
        return opts.showStartedBadge ? "En curso" : undefined;
    }

    const diffMin = Math.ceil(diffMs / 60_000);

    if (diffMin < 60) {
        return `En ${diffMin} minuto${diffMin === 1 ? "" : "s"}`;
    }

    const diffHours = Math.ceil(diffMin / 60);
    if (diffHours < 24) {
        return `En ${diffHours} hora${diffHours === 1 ? "" : "s"}`;
    }

    const diffDays = Math.ceil(diffHours / 24);
    return `En ${diffDays} día${diffDays === 1 ? "" : "s"}`;
}
