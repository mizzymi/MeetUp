import { SidebarBrand } from "./sidebar-brand";
import { SidebarNav, type SidebarNavItemData } from "./sidebar-nav";
import { SidebarUser, type SidebarUserData } from "./sidebar-user";

type SidebarProps = {
  /**
   * Navigation items to render in the sidebar menu.
   *
   * Important:
   * - Must be plain JSON-serializable objects because `SidebarNav` is a Client Component.
   * - `icon` is a string identifier, NOT a React component.
   */
  items: SidebarNavItemData[];

  /**
   * User info shown at the bottom (avatar + name + email).
   */
  user: SidebarUserData;

  /**
   * Optional extra class names (e.g. width overrides, z-index, hidden on mobile, etc.).
   */
  className?: string;
};

/**
 * Sidebar component (Server Component by default).
 *
 * Responsibilities:
 * - Provide structural layout and container styling.
 * - Compose sidebar subcomponents.
 *
 * Notes:
 * - Active route detection is done client-side in `SidebarNav` using `useLocation()`.
 */
export function Sidebar({ items, user, className }: SidebarProps) {
  return (
    <aside
      className={[
        "flex h-screen w-[280px] flex-col",
        "border-r border-slate-200 bg-white",
        "px-4 py-4",
        className ?? "",
      ].join(" ")}
    >
      <SidebarBrand />

      <div className="mt-4">
        <SidebarNav items={items} />
      </div>

      <div className="mt-auto pt-4">
        <SidebarUser user={user} />
      </div>
    </aside>
  );
}