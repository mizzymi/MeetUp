import * as React from "react";
import { cn } from "@/lib/cn";
import { User2 } from "lucide-react";
import { Button } from "@/components/ui/button/button";

/**
 * Domain model for a meeting row in "today meetings".
 */
export type TodayMeeting = {
    /**
     * Start time label (e.g. "16:00").
     */
    startLabel: string;

    /**
     * Duration label (e.g. "1h").
     */
    durationLabel: string;

    /**
     * Meeting title.
     */
    title: string;

    /**
     * Host name.
     */
    hostName: string;

    /**
     * Called when user clicks "Ver detalles".
     */
    onDetails?: () => void;
};

/**
 * Props for {@link TodayMeetingRow}.
 */
type TodayMeetingRowProps = {
    /**
     * Meeting row data.
     */
    meeting: TodayMeeting;

    /**
     * Additional classes for the row wrapper.
     */
    className?: string;
};

/**
 * Single row item for the "Reuniones de hoy" list.
 *
 * Visual:
 * - White background row
 * - Left time box
 * - CTA on right
 */
export function TodayMeetingRow({ meeting, className }: TodayMeetingRowProps) {
    return (
        <div
            className={cn(
                "flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
                className
            )}
        >
            <div className="flex items-center gap-4">
                {/* Time box */}
                <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl border border-slate-200 bg-emerald-100 text-slate-900">
                    <div className="text-sm font-semibold leading-4">{meeting.startLabel}</div>
                    <div className="text-xs text-slate-600">{meeting.durationLabel}</div>
                </div>

                {/* Info */}
                <div className="space-y-1">
                    <div className="text-base font-semibold text-slate-900">{meeting.title}</div>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                        <User2 className="h-4 w-4 text-slate-600" />
                        {meeting.hostName}
                    </div>
                </div>
            </div>

            <Button
                type="button"
                intent="secondary"
                size="md"
                onClick={meeting.onDetails}
                className="shrink-0"
            >
                Ver detalles
            </Button>
        </div>
    );
}
