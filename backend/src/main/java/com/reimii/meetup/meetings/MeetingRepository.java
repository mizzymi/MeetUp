package com.reimii.meetup.meetings;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MeetingRepository extends JpaRepository<Meeting, Long> {

    List<Meeting> findByOwnerUserIdAndStartsAtBetweenOrderByStartsAtAsc(Long ownerUserId, Instant from, Instant to);

    List<Meeting> findTop1ByOwnerUserIdAndStartsAtAfterOrderByStartsAtAsc(Long ownerUserId, Instant after);
}
