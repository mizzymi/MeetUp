import type { MeetingDetailsEventPayload } from "@/components/layout/app-shell";

export function openMeetingDetails(id: number) {
    const payload: MeetingDetailsEventPayload = { id };
    window.dispatchEvent(new CustomEvent<MeetingDetailsEventPayload>("meeting:details", { detail: payload }));
}
