package com.reimii.meetup.users;

import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository repo;

    public UserService(UserRepository repo) {
        this.repo = repo;
    }

    public AppUser upsertGoogleUser(String email, String name, String picture) {
        if (email == null || email.isBlank()) {
            throw new IllegalStateException("No email from Google. Ensure scope includes email.");
        }

        AppUser user = repo.findByEmail(email).orElseGet(AppUser::new);
        user.setEmail(email);
        user.setName(name != null ? name : "User");
        user.setPicture(picture);
        user.setProvider("google");
        return repo.save(user);
    }
}
