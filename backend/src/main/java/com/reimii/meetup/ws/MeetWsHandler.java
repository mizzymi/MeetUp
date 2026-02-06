package com.reimii.meetup.ws;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.reimii.meetup.auth.JwtService;
import com.reimii.meetup.users.AppUser;
import com.reimii.meetup.users.UserRepository;

@Component
public class MeetWsHandler extends TextWebSocketHandler {

    private final ObjectMapper om = new ObjectMapper();
    private final JwtService jwtService;
    private final UserRepository users;
    private final RoomRegistry rooms;
    private final SfuBridge sfu;

    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    public MeetWsHandler(JwtService jwtService, UserRepository users, RoomRegistry rooms, SfuBridge sfu) {
        this.jwtService = jwtService;
        this.users = users;
        this.rooms = rooms;
        this.sfu = sfu;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        AppUser me = authenticate(session);
        session.getAttributes().put("me", me);
        sessions.put(session.getId(), session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        AppUser me = (AppUser) session.getAttributes().get("me");
        var node = om.readTree(message.getPayload());
        String type = node.get("type").asText();

        String roomId = node.hasNonNull("roomId") ? node.get("roomId").asText() : null;

        if ("JOIN".equals(type)) {
            rooms.join(roomId, me.getId(), session);
            sfu.onJoin(roomId, me.getId());
            return;
        }

        if ("LEAVE".equals(type)) {
            rooms.leave(roomId, me.getId(), session);
            sfu.onLeave(roomId, me.getId());
            return;
        }

        sfu.forward(roomId, me.getId(), session, message.getPayload());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        AppUser me = (AppUser) session.getAttributes().get("me");
        if (me != null) {
            rooms.leaveAll(me.getId(), session);
        }
        sessions.remove(session.getId());
        sfu.onDisconnect(me != null ? me.getId() : null);
    }

    private AppUser authenticate(WebSocketSession session) {
        String auth = session.getHandshakeHeaders().getFirst("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            throw new RuntimeException("NO_TOKEN");
        }

        String token = auth.substring("Bearer ".length()).trim();
        var claims = jwtService.parse(token).getPayload();
        Long userId = Long.valueOf(claims.getSubject());

        return users.findById(userId).orElseThrow();
    }
}
