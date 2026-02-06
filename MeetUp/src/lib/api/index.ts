import { apiDel, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { CreateMeetingRequest, MeDto, MeetingDto } from "@/lib/api/types";

/**
 * API wrapper with semantic functions.
 * Avoids hardcoding paths in UI components.
 */
export const Api = {
    /**
     * Returns the current authenticated user (requires Bearer token).
     */
    me: () => apiGet<MeDto>("/me"),

    /**
     * Returns the next meeting or `null` if none (server may return 204).
     */
    nextMeeting: () => apiGet<MeetingDto | null>("/meetings/next"),

    /**
     * Returns meetings scheduled for today.
     */
    todayMeetings: () => apiGet<MeetingDto[]>("/meetings/today"),

    /**
     * Creates a meeting owned by the current user.
     * POST /meetings -> returns created meeting.
     */
    createMeeting: (body: CreateMeetingRequest) =>
        apiPost<MeetingDto, CreateMeetingRequest>("/meetings", body),

    meeting: (id: number) => apiGet<MeetingDto>(`/meetings/${id}`),

    updateMeeting: (id: number, body: CreateMeetingRequest) =>
        apiPut<MeetingDto, CreateMeetingRequest>(`/meetings/${id}`, body),
    deleteMeeting: (id: number) => apiDel<void>(`/meetings/${id}`),
};
