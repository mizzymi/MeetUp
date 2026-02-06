import type { MeetingDto } from "@/lib/api/types";

export function openMeetingEdit(meeting: MeetingDto) {
    window.dispatchEvent(new CustomEvent("meeting:edit", { detail: { meeting } }));
}
