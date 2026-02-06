import * as React from "react";
import { NavLink, NavLinkRenderProps } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Home, CalendarDays, Settings } from "lucide-react";
import type { SidebarIconName } from "./sidebar-nav";

type SidebarNavItemProps = {
    /**
     * Visible label.
     */
    label: string;

    /**
     * Link destination.
     */
    href: string;

    /**
     * Serializable icon identifier.
     */
    icon: SidebarIconName;
    
};

/**
 * Maps icon identifiers to actual Lucide icon components.
 *
 * Important:
 * - This mapping lives on the Client side (or inside a file imported by client),
 *   so Server Components never have to pass icon components through props.
 */
const ICONS: Record<SidebarIconName, React.ElementType> = {
    home: Home,
    calendar: CalendarDays,
    settings: Settings,
};

/**
 * Single sidebar navigation item.
 *
 * Accessibility:
 * - When `active`, sets `aria-current="page"`.
 */
export function SidebarNavItem({
    label,
    href,
    icon,
}: SidebarNavItemProps) {
    const Icon = ICONS[icon];

    return (
        <NavLink to={href} end={href === "/"}>
            {({ isActive }: NavLinkRenderProps) => (
                <span
                    className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition cursor-pointer",
                        isActive
                            ? "bg-emerald-100 text-slate-900"
                            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    )}
                    role="link"
                    aria-current={isActive ? "page" : undefined}
                >
                    <Icon className={cn("h-4 w-4", isActive ? "text-slate-900" : "text-slate-700")} />
                    <span className="truncate">{label}</span>
                </span>
            )}
        </NavLink>
    );
}
