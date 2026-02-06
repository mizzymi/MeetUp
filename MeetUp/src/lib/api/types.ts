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
    participants: MeetingParticipantDto[];
    guestName?: string;
    guestAvatarUrl?: string;
    createVideoLink: boolean;
    roomUrl?: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
};

export type MeetingParticipantDto = {
    email: string;
    userId?: number;
    name?: string;
    avatarUrl?: string;
    role: "OWNER" | "PRIMARY_GUEST" | "GUEST";
};

export type CreateMeetingRequest = {
    title: string;
    startsAt: string; // ISO
    endsAt: string;   // ISO
    guestEmail: string;
    notes?: string;
    createVideoLink: boolean;
};
