import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button/button";
import { Clock, User2, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Data model for the "Next meeting" hero card.
 */
export type NextMeeting = {
    /** Meeting title. */
    title: string;

    /** Start datetime. */
    startsAt?: Date | string;

    /** Ends datetime. */
    endsAt?: Date | string;

    /** Human label shown in the UI (e.g. "14:30"). */
    startsAtLabel: string;

    /** End time label shown in the UI (e.g. "15:30"). */
    endsAtLabel: string;

    /** Host / organizer name. */
    hostName: string;

    /** Optional description below metadata. */
    description?: string;

    /**
     * Room URL/path:
     * - "http://localhost:5173/meetup-xxxx"
     * - "/meetup-xxxx"
     * - "meetup-xxxx"
     */
    roomUrl?: string;

    /**
     * Optional override for the badge text.
     * If omitted, the badge will be computed from the meeting start time.
     */
    inLabel?: string;

    /** Called when user clicks "Entrar" (overrides default navigation). */
    onEnter?: () => void;
};

type NextMeetingCardProps = {
    meeting: NextMeeting;
    className?: string;
    tickSeconds?: number;
    showStartedBadge?: boolean;
    fastRefreshThresholdMinutes?: number;
};

export function NextMeetingCard({
    meeting,
    className,
    tickSeconds = 30,
    showStartedBadge = true,
    fastRefreshThresholdMinutes = 2,
}: NextMeetingCardProps) {
    const navigate = useNavigate();

    const [now, setNow] = useState<Date>(() => new Date());

    const start = useMemo(
        () => resolveStartDate(meeting.startsAt, meeting.startsAtLabel),
        [meeting.startsAt, meeting.startsAtLabel]
    );

    const end = useMemo(
        () => resolveStartDate(meeting.endsAt, meeting.endsAtLabel),
        [meeting.endsAt, meeting.endsAtLabel]
    );

    const msLeft = start ? start.getTime() - now.getTime() : null;

    const effectiveTickSeconds = useMemo(() => {
        if (msLeft == null) return tickSeconds;
        if (msLeft <= 0) return 10;

        const thresholdMs = fastRefreshThresholdMinutes * 60 * 1000;
        if (msLeft <= thresholdMs) return 1;

        return tickSeconds;
    }, [msLeft, tickSeconds, fastRefreshThresholdMinutes]);

    useEffect(() => {
        const id = window.setInterval(() => setNow(new Date()), effectiveTickSeconds * 1000);
        return () => window.clearInterval(id);
    }, [effectiveTickSeconds]);

    const computedInLabel = useMemo(() => {
        if (meeting.inLabel) return meeting.inLabel;
        if (!start) return undefined;

        return formatMeetingBadge(start, end, now, { showStartedBadge });
    }, [meeting.inLabel, start, end, now, showStartedBadge]);

    const roomUrl = (meeting.roomUrl ?? "").trim();
    const canEnter = !!meeting.onEnter || !!roomUrl;

    const handleEnter = () => {
        if (meeting.onEnter) return meeting.onEnter();

        const raw = (meeting.roomUrl ?? "").trim();
        if (!raw) return;

        if (raw.startsWith("http")) {
            const u = new URL(raw);
            u.searchParams.set("autojoin", "1");
            window.location.assign(u.toString());
            return;
        }

        const base = toInternalPath(raw);
        navigate(base);
    };

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
                    onClick={handleEnter}
                    disabled={!canEnter}
                    className="shrink-0"
                >
                    Entrar
                </Button>
            </div>
        </div>
    );
}

function toInternalPath(urlOrPath: string) {
    if (urlOrPath.startsWith("/")) return urlOrPath;

    if (urlOrPath.startsWith("http")) {
        const u = new URL(urlOrPath);
        return u.pathname + u.search;
    }

    return "/" + urlOrPath;
}

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

function formatMeetingBadge(
    start: Date,
    end: Date | null,
    now: Date,
    opts: { showStartedBadge: boolean }
): string | undefined {
    const nowMs = now.getTime();
    const startMs = start.getTime();
    const endMs = end?.getTime();

    const graceMs = 30_000; // 30s
    if (opts.showStartedBadge) {
        if (nowMs >= startMs - graceMs && (endMs == null || nowMs <= endMs + graceMs)) {
            return "En curso";
        }
    }

    const diffMs = startMs - nowMs;
    if (diffMs <= 0) return opts.showStartedBadge ? "En curso" : undefined;

    if (diffMs < 60_000) return "En menos de 1 minuto";

    const diffMin = Math.ceil(diffMs / 60_000);
    if (diffMin < 60) return `En ${diffMin} minuto${diffMin === 1 ? "" : "s"}`;

    const diffHours = Math.ceil(diffMin / 60);
    if (diffHours < 24) return `En ${diffHours} hora${diffHours === 1 ? "" : "s"}`;

    const diffDays = Math.ceil(diffHours / 24);
    return `En ${diffDays} día${diffDays === 1 ? "" : "s"}`;
}
