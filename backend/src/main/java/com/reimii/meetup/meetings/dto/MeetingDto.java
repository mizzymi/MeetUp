package com.reimii.meetup.meetings.dto;

import java.util.List;

public record MeetingDto(
        long id,
        long ownerUserId,
        String title,
        String startsAt,
        String endsAt,
        String hostName,
        String guestEmail,
        List<MeetingParticipantDto> participants,
        String guestName,
        String guestAvatarUrl,
        boolean createVideoLink,
        String roomUrl,
        String notes,
        String createdAt,
        String updatedAt
        ) {

}
