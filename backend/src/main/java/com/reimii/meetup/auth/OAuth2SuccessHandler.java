package com.reimii.meetup.auth;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.reimii.meetup.users.AppUser;
import com.reimii.meetup.users.UserService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserService userService;
    private final String frontendBaseUrl;

    public OAuth2SuccessHandler(JwtService jwtService,
            UserService userService,
            @Value("${app.frontend.base-url}") String frontendBaseUrl) {
        this.jwtService = jwtService;
        this.userService = userService;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException {

        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

        String email = oauthUser.getAttribute("email");
        String name = oauthUser.getAttribute("name");
        String picture = oauthUser.getAttribute("picture");

        AppUser user = userService.upsertGoogleUser(email, name, picture);

        String token = jwtService.createToken(user.getId(), user.getEmail());

        String redirect = frontendBaseUrl + "/auth/callback?token="
                + URLEncoder.encode(token, StandardCharsets.UTF_8);

        response.sendRedirect(redirect);
    }
}
