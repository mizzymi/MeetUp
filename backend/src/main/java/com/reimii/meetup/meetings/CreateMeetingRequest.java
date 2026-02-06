package com.reimii.meetup.meetings;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateMeetingRequest(
        @NotBlank
        String title,
        @NotNull
        String startsAt,
        @NotNull
        String endsAt,
        @NotBlank
        @Email
        String guestEmail,
        String notes,
        boolean createVideoLink
        ) {

}
