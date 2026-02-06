import { useEffect } from "react";
import { createPortal } from "react-dom";
import { SidebarUser } from "./sidebar-user";
import { Button } from "../ui/button";
import { Menu } from "lucide-react";

type SidebarUser = {
    name: string;
    email: string;
    avatarUrl?: string;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: SidebarUser;
    children: React.ReactNode; // aquí metemos <Sidebar ... />
};

export function MobileSidebarDock({ open, onOpenChange, user, children }: Props) {
    // Cerrar con ESC
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onOpenChange(false);
        };
        if (open) window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onOpenChange]);

    return (
        <>
            {/* Bottom bar (hamburguesa + user) */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/90 backdrop-blur">
                <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <SidebarUser user={{
                            name: user.name,
                            email: user.email,
                            avatarUrl: user.avatarUrl
                        }} />
                    </div>

                    <Button
                        type="button"
                        onClick={() => onOpenChange(true)}
                        aria-label="Open menu"
                        leftIcon={Menu}
                        showLeftIcon
                    >
                        {/* icon hamburguesa */}
                        <span className="font-medium">Menu</span>
                    </Button>
                </div>
            </div>

            {/* Drawer (portal) */}
            {open
                ? createPortal(
                    <div className="fixed inset-0 z-50">
                        {/* overlay */}
                        <button
                            type="button"
                            className="absolute inset-0 bg-black/35"
                            aria-label="Close menu"
                            onClick={() => onOpenChange(false)}
                        />
                        {/* panel */}
                        <div className="absolute left-0 top-0 h-screen w-[280px] flex-col bg-white shadow-2xl">
                            {children}
                        </div>
                    </div>,
                    document.body
                )
                : null}
        </>
    );
}
