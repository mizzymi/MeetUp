
import { useEffect, useState } from "react";

import { PageTopbar } from "@/components/layout/page-topbar";
import { NewMeetingModal } from "@/components/meetings/new-meeting-modal";
import { MeetingDetailsModal } from "@/components/meetings/meeting-details-modal";
import { useNewMeetingModal } from "@/hooks/use-new-meeting-modal";

import { Api } from "@/lib/api";
import type { MeDto, MeetingDto } from "@/lib/api/types";
import { datetimeLocalToIso, isoToDatetimeLocal } from "@/lib/time/datetime-local";

/**
 * AppShellProps
 * ------------
 * Wraps routed pages under the authenticated area.
 *
 * Notes:
 * - This component is a Client Component because it owns UI state (modals).
 * - `children` can be Server or Client content (depending on your router setup).
 */
export type AppShellProps = {
    /**
     * Routed page content.
     */
    children: React.ReactNode;

    title: string;
};

/**
 * CustomEvent payload for opening the "Meeting details" modal from anywhere.
 *
 * Usage:
 *   window.dispatchEvent(new CustomEvent("meeting:details", { detail: { id: 123 } }));
 */
export type MeetingDetailsEventPayload = {
    /**
     * Meeting id to load in the details modal.
     */
    id: number;
};

/**
 * AppShell
 * --------
 * Centralizes global UI elements for the app:
 * - Topbar
 * - "New meeting" modal
 * - "Meeting details" modal
 *
 * Why this exists:
 * - Server Components cannot call client hooks.
 * - Keeping the modal state here makes it accessible across all /app pages.
 *
 * Data flow:
 * - Pages/components trigger events:
 *   - `meetings:changed` (after create/delete/update) so pages can refresh lists
 *   - `meeting:details` to open details modal for a given meeting
 */
export function AppShell({ children, title }: AppShellProps) {
    /**
     * Current authenticated user.
     * Needed for permissions in MeetingDetailsModal (e.g., delete rules).
     */
    const [me, setMe] = useState<MeDto | null>(null);

    /**
     * Details modal state.
     */
    const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
    const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);

    /**
     * Load current user on mount.
     *
     * This should succeed in authenticated routes. If it fails (401/403),
     * page-level guards (or route-level redirects) should handle navigation.
     */
    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                const meRes = await Api.me();
                if (!alive) return;
                setMe(meRes);
            } catch {
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    /**
     * "New meeting" modal hook.
     * Creates the meeting and broadcasts `meetings:changed` so pages can refetch.
     */
    const newMeetingModal = useNewMeetingModal({
        onSave: async (values, editingId) => {
            const body = {
                title: values.title,
                startsAt: datetimeLocalToIso(values.startAt),
                endsAt: datetimeLocalToIso(values.endAt),
                guestEmail: values.guestEmail,
                notes: values.notes?.trim() ? values.notes.trim() : undefined,
                createVideoLink: values.createVideoLink,
            };

            if (editingId) {
                await Api.updateMeeting(editingId, body);
            } else {
                await Api.createMeeting(body);
            }

            window.dispatchEvent(new Event("meetings:changed"));
        },
    });


    /**
     * Global listener that opens the details modal.
     *
     * Any component can open the modal via:
     *   window.dispatchEvent(new CustomEvent("meeting:details", { detail: { id } }));
     */
    useEffect(() => {
        const onOpenDetails = (ev: Event) => {
            const custom = ev as CustomEvent<MeetingDetailsEventPayload>;
            const id = custom.detail?.id;

            if (typeof id !== "number" || Number.isNaN(id)) return;

            setSelectedMeetingId(id);
            setDetailsOpen(true);
        };

        window.addEventListener("meeting:details", onOpenDetails as EventListener);
        return () => window.removeEventListener("meeting:details", onOpenDetails as EventListener);
    }, []);

    useEffect(() => {
        const onEdit = (e: Event) => {
            const ev = e as CustomEvent<{ meeting: MeetingDto }>;
            const m = ev.detail.meeting;

            newMeetingModal.openEdit(m.id, {
                title: m.title ?? "",
                startAt: isoToDatetimeLocal(m.startsAt),
                endAt: isoToDatetimeLocal(m.endsAt),
                guestEmail: m.guestEmail ?? "",
                notes: m.notes ?? "",
                createVideoLink: !!m.createVideoLink,
            });
        };

        window.addEventListener("meeting:edit", onEdit);
        return () => window.removeEventListener("meeting:edit", onEdit);
    }, [newMeetingModal]);


    return (
        <div className="flex-1">
            <PageTopbar title={title} onNewMeeting={newMeetingModal.openCreate} />

            <NewMeetingModal
                open={newMeetingModal.open}
                onOpenChange={newMeetingModal.setOpen}
                values={newMeetingModal.values}
                setValue={newMeetingModal.setValue}
                onSubmit={newMeetingModal.submit}
                saving={newMeetingModal.saving}
            />

            <MeetingDetailsModal
                open={detailsOpen}
                onOpenChange={(next) => {
                    setDetailsOpen(next);
                    if (!next) setSelectedMeetingId(null);
                }}
                meetingId={selectedMeetingId}
                me={me}
                onDeleted={() => {
                    setDetailsOpen(false);
                    setSelectedMeetingId(null);
                    window.dispatchEvent(new Event("meetings:changed"));
                }}
            />

            <main className="p-2">{children}</main>
        </div>
    );
}
