/**
 * Data required to render the bottom user card.
 */
export type SidebarUserData = {
    /**
     * User display name.
     */
    name: string;

    /**
     * User email (or secondary identifier).
     */
    email: string;

    /**
     * Avatar image URL (local `/...` or remote if configured in next.config.js).
     */
    avatarUrl?: string;

};

type SidebarUserProps = {
    /**
     * User object shown in the footer.
     */
    user: SidebarUserData;
};

/**
 * Bottom user card for the sidebar.
 *
 * Notes:
 * - Includes a top border separator to match the mock.
 * - Uses truncation to avoid overflow on long names/emails.
 */
export function SidebarUser({ user }: SidebarUserProps) {
    return (
        <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full">
                <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                />
            </div>

            <div className="min-w-0 leading-tight">
                <div className="truncate text-sm font-semibold text-slate-900">{user.name}</div>
                <div className="truncate text-xs text-slate-500">{user.email}</div>
            </div>
        </div>
    );
}