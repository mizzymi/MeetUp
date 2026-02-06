package com.reimii.meetup.ws;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

@Component
public class RoomRegistry {

    private final Map<String, Map<Long, Set<WebSocketSession>>> rooms = new ConcurrentHashMap<>();

    public void join(String roomId, Long userId, WebSocketSession session) {
        rooms.computeIfAbsent(roomId, k -> new ConcurrentHashMap<>())
                .computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet())
                .add(session);
    }

    public void leave(String roomId, Long userId, WebSocketSession session) {
        var byUser = rooms.get(roomId);
        if (byUser == null) {
            return;
        }
        var set = byUser.get(userId);
        if (set == null) {
            return;
        }
        set.remove(session);
        if (set.isEmpty()) {
            byUser.remove(userId);
        }
        if (byUser.isEmpty()) {
            rooms.remove(roomId);
        }
    }

    public void leaveAll(Long userId, WebSocketSession session) {
        for (var roomId : new ArrayList<>(rooms.keySet())) {
            leave(roomId, userId, session);
        }
    }
}
