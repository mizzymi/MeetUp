"use client";

import * as React from "react";
import { PageTopbar } from "@/components/layout/page-topbar";
import { NewMeetingModal } from "@/components/meetings/new-meeting-modal";
import { useNewMeetingModal } from "@/hooks/use-new-meeting-modal";
import { Api } from "@/lib/api";
import { datetimeLocalToIso } from "@/lib/time/datetime-local";

type AppShellProps = {
    /**
     * Routed page content (Server Components are allowed as children).
     */
    children: React.ReactNode;
};

/**
 * AppShell
 *
 * Why this exists:
 * - Server Components cannot call client hooks.
 * - This component is marked `"use client"`, so it can own the modal hook/state.
 *
 * Notes:
 * - Keeping the modal here makes it available across all pages under /app.
 */
export function AppShell({ children }: AppShellProps) {
    const modal = useNewMeetingModal({
        onSave: async (values) => {
            await Api.createMeeting({
                title: values.title,
                startsAt: datetimeLocalToIso(values.startAt),
                endsAt: datetimeLocalToIso(values.endAt),
                guestEmail: values.guestEmail,
                notes: values.notes?.trim() ? values.notes.trim() : undefined,
                createVideoLink: values.createVideoLink,
            });

            window.dispatchEvent(new Event("meetings:changed"));
        },
    });
    return (
        <div className="flex-1">
            <PageTopbar onNewMeeting={modal.onOpen} />

            <NewMeetingModal
                open={modal.open}
                onOpenChange={modal.setOpen}
                values={modal.values}
                setValue={modal.setValue}
                onSubmit={modal.submit}
                saving={modal.saving}
            />

            <main className="p-2">{children}</main>
        </div>
    );
}
