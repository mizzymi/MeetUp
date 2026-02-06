import { cn } from "@/lib/cn";

/**
 * Wrapper container for a list of meeting rows.
 */
export function TodayMeetingsList({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={cn("rounded-xl border border-slate-200 bg-white p-4 space-y-4", className)}>
            {children}
        </div>
    );
}
