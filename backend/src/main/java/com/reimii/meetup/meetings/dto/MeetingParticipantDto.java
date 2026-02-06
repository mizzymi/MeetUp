package com.reimii.meetup.meetings.dto;

public record MeetingParticipantDto(
        Long userId,
        String email,
        String name,
        String avatarUrl,
        String role
        ) {

}
