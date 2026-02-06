package com.reimii.meetup.meetings;

import java.util.List;

import org.springframework.stereotype.Component;

import com.reimii.meetup.meetings.dto.MeetingDto;
import com.reimii.meetup.meetings.dto.MeetingParticipantDto;

@Component
public class MeetingMapper {

    public MeetingDto toDto(Meeting m, List<MeetingParticipant> participants) {
        var parts = participants.stream()
                .map(p -> new MeetingParticipantDto(
                p.getUserId(),
                p.getEmail(),
                p.getName(),
                p.getAvatarUrl(),
                p.getRole().name()
        ))
                .toList();

        return new MeetingDto(
                m.getId(),
                m.getOwnerUserId(),
                m.getTitle(),
                m.getStartsAt().toString(),
                m.getEndsAt().toString(),
                m.getHostName(),
                m.getGuestEmail(),
                parts,
                m.getGuestName(),
                m.getGuestAvatarUrl(),
                m.isCreateVideoLink(),
                m.getRoomUrl(),
                m.getNotes(),
                m.getCreatedAt() != null ? m.getCreatedAt().toString() : null,
                m.getUpdatedAt() != null ? m.getUpdatedAt().toString() : null
        );
    }
}
