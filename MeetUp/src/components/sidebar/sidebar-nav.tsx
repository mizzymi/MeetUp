import { useLocation } from "react-router-dom";
import { SidebarNavItem } from "./sidebar-nav-item";

/**
 * Icon identifiers supported by the sidebar.
 *
 * Keep this type small and explicit to avoid typos.
 * Add new values whenever you add new icons in the map.
 */
export type SidebarIconName = "home" | "calendar" | "settings";

/**
 * Serializable shape of a sidebar item (safe to pass from Server -> Client).
 */
export type SidebarNavItemData = {
    /**
     * Visible label for the menu entry.
     */
    label: string;

    /**
     * Target route path.
     */
    href: string;

    /**
     * Serializable icon identifier.
     * The actual Lucide component is resolved inside the client component.
     */
    icon: SidebarIconName;
};

type SidebarNavProps = {
    /**
     * Menu items list.
     */
    items: SidebarNavItemData[];
};

/**
 * Sidebar navigation list.
 *
 * Active logic:
 * - exact match: pathname === href
 * - nested match: pathname starts with `${href}/`
 *   (useful for sections like `/app/calendar/...`)
 */
export function SidebarNav({ items }: SidebarNavProps) {
    const { pathname } = useLocation();

    return (
        <nav className="space-y-1" aria-label="Sidebar navigation">
            {items.map((item) => {
                const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname?.startsWith(item.href + "/"));

                return (
                    <SidebarNavItem
                        key={item.href}
                        label={item.label}
                        href={item.href}
                        icon={item.icon}
                    />
                );
            })}
        </nav>
    );
}