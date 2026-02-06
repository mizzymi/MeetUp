/**
 * Backend DTOs (data shapes) used by the API layer.
 * Keep these aligned with your Spring controllers.
 */

export type MeDto = {
    authenticated: boolean;
    id: number;
    email: string;
    name: string;
    picture?: string;
    provider?: string;
};

export type MeetingDto = {
    id: number;
    ownerUserId: number;
    title: string;
    startsAt: string; // ISO string
    endsAt: string;   // ISO string
    hostName: string;

    guestEmail: string;
    notes?: string;
    createVideoLink: boolean;
};

/**
 * Request body for POST /meetings.
 * Notes:
 * - startsAt / endsAt MUST be ISO strings (Instant.parse on the server).
 */
export type CreateMeetingRequest = {
    title: string;
    startsAt: string; // ISO
    endsAt: string;   // ISO
    guestEmail: string;
    notes?: string;
    createVideoLink: boolean;
};
