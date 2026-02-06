package com.reimii.meetup.meetings;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.reimii.meetup.users.AppUser;

@RestController
public class MeetingController {

    private final MeetingRepository repo;

    public MeetingController(MeetingRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/meetings/today")
    public List<Meeting> today(Authentication auth) {
        AppUser user = (AppUser) auth.getPrincipal();

        ZoneId zone = ZoneId.of("Europe/Madrid");
        LocalDate today = LocalDate.now(zone);

        Instant from = today.atStartOfDay(zone).toInstant();
        Instant to = today.plusDays(1).atStartOfDay(zone).toInstant();

        return repo.findByOwnerUserIdAndStartsAtBetweenOrderByStartsAtAsc(user.getId(), from, to);
    }

    @GetMapping("/meetings/next")
    public ResponseEntity<Meeting> next(Authentication auth) {
        AppUser user = (AppUser) auth.getPrincipal();

        var list = repo.findTop1ByOwnerUserIdAndStartsAtAfterOrderByStartsAtAsc(user.getId(), Instant.now());

        if (list.isEmpty()) {
            return ResponseEntity.noContent().build(); // 204
        }
        return ResponseEntity.ok(list.get(0)); // 200 + JSON
    }

    /**
     * Creates a new meeting owned by the authenticated user.
     *
     * Expected ISO strings for startsAt/endsAt, e.g.: "2026-02-06T14:30:00Z" If
     * your frontend uses <input type="datetime-local">, convert to ISO in the
     * client.
     */
    @PostMapping("/meetings")
    public Meeting create(Authentication auth, @Valid @RequestBody CreateMeetingRequest body) {
        AppUser user = (AppUser) auth.getPrincipal();

        Meeting m = new Meeting();
        m.setOwnerUserId(user.getId());
        m.setTitle(body.title());
        m.setStartsAt(Instant.parse(body.startsAt()));
        m.setEndsAt(Instant.parse(body.endsAt()));
        m.setHostName(user.getName());

        // Required by your modal
        m.setGuestEmail(body.guestEmail());
        m.setNotes(body.notes());
        m.setCreateVideoLink(body.createVideoLink());

        return repo.save(m);
    }
}
