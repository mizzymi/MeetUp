package com.reimii.meetup.meetings;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.reimii.meetup.meetings.dto.MeetingDto;
import com.reimii.meetup.users.AppUser;

import jakarta.validation.Valid;

@RestController
public class MeetingController {

    private final MeetingRepository meetings;
    private final MeetingParticipantRepository participants;
    private final MeetingMapper mapper;

    public MeetingController(MeetingRepository meetings, MeetingParticipantRepository participants, MeetingMapper mapper) {
        this.meetings = meetings;
        this.participants = participants;
        this.mapper = mapper;
    }

    @GetMapping("/meetings/today")
    public List<MeetingDto> today(Authentication auth) {
        AppUser user = (AppUser) auth.getPrincipal();

        ZoneId zone = ZoneId.of("Europe/Madrid");
        LocalDate today = LocalDate.now(zone);

        Instant from = today.atStartOfDay(zone).toInstant();
        Instant to = today.plusDays(1).atStartOfDay(zone).toInstant();

        return meetings.findByOwnerUserIdAndStartsAtBetweenOrderByStartsAtAsc(user.getId(), from, to)
                .stream()
                .map(m -> mapper.toDto(m, participants.findByMeetingId(m.getId())))
                .toList();
    }

    @GetMapping("/meetings/next")
    public ResponseEntity<MeetingDto> next(Authentication auth) {
        AppUser user = (AppUser) auth.getPrincipal();

        var opt = meetings.findTop1ByOwnerUserIdAndStartsAtAfterOrderByStartsAtAsc(user.getId(), Instant.now());
        if (opt.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        var m = opt.get();
        return ResponseEntity.ok(mapper.toDto(m, participants.findByMeetingId(m.getId())));
    }

    @GetMapping("/meetings/{id}")
    public ResponseEntity<MeetingDto> getById(Authentication auth, @PathVariable("id") Long id) {
        AppUser user = (AppUser) auth.getPrincipal();

        var mOpt = meetings.findById(id);
        if (mOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var m = mOpt.get();

        boolean owner = m.getOwnerUserId().equals(user.getId());
        boolean invitedByEmail = user.getEmail() != null && user.getEmail().equalsIgnoreCase(m.getGuestEmail());

        if (!owner && !invitedByEmail) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(mapper.toDto(m, participants.findByMeetingId(m.getId())));
    }

    @PostMapping("/meetings")
    public MeetingDto create(Authentication auth, @Valid @RequestBody CreateMeetingRequest body) {
        AppUser user = (AppUser) auth.getPrincipal();

        Meeting m = new Meeting();
        m.setOwnerUserId(user.getId());
        m.setTitle(body.title());
        m.setStartsAt(Instant.parse(body.startsAt()));
        m.setEndsAt(Instant.parse(body.endsAt()));
        m.setHostName(user.getName());
        m.setGuestEmail(body.guestEmail());
        m.setNotes(body.notes());
        m.setCreateVideoLink(body.createVideoLink());

        if (body.createVideoLink()) {
            if (m.getRoomUrl() == null || m.getRoomUrl().isBlank()) {
                m.setRoomUrl("/meet/meetup-" + java.util.UUID.randomUUID());
            }
        } else {
            m.setRoomUrl(null);
        }

        m = meetings.save(m);

        MeetingParticipant owner = new MeetingParticipant();
        owner.setMeeting(m);
        owner.setUserId(user.getId());
        owner.setEmail(user.getEmail() != null ? user.getEmail() : "owner@local");
        owner.setName(user.getName());
        owner.setAvatarUrl(user.getPicture());
        owner.setRole(MeetingParticipantRole.OWNER);
        participants.save(owner);

        MeetingParticipant guest = new MeetingParticipant();
        guest.setMeeting(m);
        guest.setUserId(null);
        guest.setEmail(body.guestEmail());
        guest.setName(null);
        guest.setAvatarUrl(null);
        guest.setRole(MeetingParticipantRole.PRIMARY_GUEST);
        participants.save(guest);

        return mapper.toDto(m, participants.findByMeetingId(m.getId()));
    }

    @PutMapping("/meetings/{id}")
    public ResponseEntity<MeetingDto> update(
            Authentication auth,
            @PathVariable("id") Long id,
            @Valid @RequestBody CreateMeetingRequest body
    ) {
        AppUser user = (AppUser) auth.getPrincipal();

        var mOpt = meetings.findById(id);
        if (mOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var m = mOpt.get();

        boolean isOwner = m.getOwnerUserId().equals(user.getId());
        boolean isPrimaryGuest = participants.existsByMeetingIdAndUserIdAndRole(
                id, user.getId(), MeetingParticipantRole.PRIMARY_GUEST
        );

        if (!isOwner && !isPrimaryGuest) {
            return ResponseEntity.status(403).build();
        }

        Instant start = Instant.parse(body.startsAt());
        Instant end = Instant.parse(body.endsAt());
        if (!end.isAfter(start)) {
            return ResponseEntity.badRequest().build();
        }

        m.setTitle(body.title());
        m.setStartsAt(start);
        m.setEndsAt(end);
        m.setGuestEmail(body.guestEmail());
        m.setNotes(body.notes());
        m.setCreateVideoLink(body.createVideoLink());

        if (body.createVideoLink()) {
            if (m.getRoomUrl() == null || m.getRoomUrl().isBlank()) {
                m.setRoomUrl("/meetup-" + java.util.UUID.randomUUID());
            }
        } else {
            m.setRoomUrl(null);
        }

        m = meetings.save(m);

        var parts = participants.findByMeetingId(id);

        MeetingParticipant pg = parts.stream()
                .filter(p -> p.getRole() == MeetingParticipantRole.PRIMARY_GUEST)
                .findFirst()
                .orElse(null);

        if (pg == null) {
            pg = new MeetingParticipant();
            pg.setMeeting(m);
            pg.setRole(MeetingParticipantRole.PRIMARY_GUEST);
            pg.setUserId(null);
            pg.setName(null);
            pg.setAvatarUrl(null);
        }

        pg.setEmail(body.guestEmail());
        participants.save(pg);

        return ResponseEntity.ok(mapper.toDto(m, participants.findByMeetingId(m.getId())));
    }

    @DeleteMapping("/meetings/{id}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable("id") Long id) {
        AppUser user = (AppUser) auth.getPrincipal();

        var mOpt = meetings.findById(id);
        if (mOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var m = mOpt.get();

        boolean isOwner = m.getOwnerUserId().equals(user.getId());
        boolean isPrimaryGuest = participants.existsByMeetingIdAndUserIdAndRole(id, user.getId(), MeetingParticipantRole.PRIMARY_GUEST);

        if (!isOwner && !isPrimaryGuest) {
            return ResponseEntity.status(403).build();
        }

        participants.findByMeetingId(id).forEach(participants::delete);
        meetings.delete(m);

        return ResponseEntity.noContent().build();
    }
}
