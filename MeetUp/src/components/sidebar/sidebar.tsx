import { useEffect, useMemo, useState } from "react";
import { MobileSidebarDock } from "./mobile-sidebar-dock";
import { SidebarBrand } from "./sidebar-brand";
import { SidebarNav, type SidebarNavItemData } from "./sidebar-nav";
import { SidebarUser, type SidebarUserData } from "./sidebar-user";
import { MeDto } from "@/lib/api/types";
import { Api } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeDto | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const [meRes, nextRes, todayRes] = await Promise.all([
          Api.me(),
          Api.nextMeeting(),
          Api.todayMeetings(),
        ]);

        if (!alive) return;

        setMe(meRes);
      } catch (e) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          navigate("/login", { replace: true });
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [navigate]);

  const sidebarUser = useMemo(() => {
    if (!me) return { name: "Loading…", email: "", avatarUrl: undefined };
    return {
      name: me.name ?? "User",
      email: me.email ?? "",
      avatarUrl: me.picture ?? undefined,
    };
  }, [me]);
  return (
    <>
      <aside
        className={[
          "hidden md:flex",
          "h-screen w-[280px] flex-col",
          "border-r border-slate-200 bg-white",
          "px-4 py-4",
          className ?? "",
        ].join(" ")}
      >
        <SidebarBrand />

        <div className="mt-4 flex-1">
          <SidebarNav items={items} />
        </div>

        <div className="mt-auto pt-4">
          <SidebarUser user={user} />
        </div>
      </aside>
      <div className="md:hidden">
        <MobileSidebarDock
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          user={sidebarUser}
        >
          <SidebarBrand />

          <div className="mt-4 flex-1">
            <SidebarNav items={items} />
          </div>
          
        </MobileSidebarDock>
      </div>
    </>
  );
}