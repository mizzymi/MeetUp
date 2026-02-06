import { Video } from "lucide-react";
import { IconBadge } from "../ui/icons";

/**
 * Top brand block for the sidebar.
 *
 * Usage:
 * - Rendered by `Sidebar` as the first item.
 * - Keep this dumb/presentational; no navigation logic here.
 */
export function SidebarBrand() {
    return (
        <div className="flex items-start gap-3">
            {/* App mark / icon */}
            <IconBadge
                icon={Video}
                tone="logo"
                variant="soft"
                className="h-12 w-12 rounded-2xl"
            />

            {/* App name + subtitle */}
            <div className="leading-tight">
                <div className="text-sm font-semibold text-slate-900">MeetUp</div>
                <div className="text-xs text-slate-500">Videollamadas 1:1</div>
            </div>
        </div>
    );
}