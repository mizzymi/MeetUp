import { Plus, CalendarDays } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button/button";

type PageTopbarProps = {
    /**
     * Main title shown on the left.
     * @defaultValue "Inicio"
     */
    title?: string;

    /**
     * Supporting subtitle/description shown under the title.
     * @defaultValue "Gestiona tus reuniones y videollamadas"
     */
    subtitle?: string;

    /**
     * Optional className to tweak spacing, sticky behavior, z-index, etc.
     */
    className?: string;

    /**
     * Handler for the primary action ("Nueva reunión").
     */
    onNewMeeting?: () => void;

    /**
     * Handler for the secondary action ("Programar").
     */
    onSchedule?: () => void;

    /**
     * Whether to show the action buttons.
     * Useful if some pages are read-only or don't have actions.
     * @defaultValue true
     */
    showActions?: boolean;

    /**
     * Allows disabling individual actions (e.g., while loading).
     */
    disableNewMeeting?: boolean;
    disableSchedule?: boolean;
};

/**
 * PageTopbar
 *
 * A reusable top header row for pages:
 * - Title + description on the left
 * - Action buttons on the right (uses your existing `Button` component)
 *
 * Typical usage:
 * ```tsx
 * <PageTopbar
 *   title="Inicio"
 *   subtitle="Gestiona tus reuniones y videollamadas"
 *   onNewMeeting={() => setOpen(true)}
 *   onSchedule={() => router.push("/app/calendar/new")}
 * />
 * ```
 */
export function PageTopbar({
    title = "Inicio",
    subtitle = "Gestiona tus reuniones y videollamadas",
    className,
    onNewMeeting,
    onSchedule,
    showActions = true,
    disableNewMeeting,
    disableSchedule,
}: PageTopbarProps) {
    return (
        <header
            className={cn(
                "flex items-start justify-between gap-4",
                "border-b border-slate-200 bg-white",
                "px-6 py-4",
                className
            )}
        >
            {/* Left: Title + subtitle */}
            <div className="min-w-0">
                <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
                <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            </div>

            {/* Right: Actions */}
            {showActions ? (
                <div className="flex shrink-0 items-center gap-3">
                    <Button
                        intent="primary"
                        leftIcon={Plus}
                        onClick={onNewMeeting}
                        disabled={disableNewMeeting}
                    >
                        Nueva reunión
                    </Button>
                </div>
            ) : null}
        </header>
    );
}