package com.reimii.meetup.meetings;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MeetingParticipantRepository extends JpaRepository<MeetingParticipant, Long> {

    List<MeetingParticipant> findByMeetingId(Long meetingId);

    boolean existsByMeetingIdAndUserIdAndRole(Long meetingId, Long userId, MeetingParticipantRole role);
}
