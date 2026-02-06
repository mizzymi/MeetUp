package com.reimii.meetup.ws;

import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.WebSocketConnectionManager;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * SfuBridge -------- Maintains a single outgoing WebSocket connection from
 * Spring -> SFU service (Node).
 *
 * It forwards client requests to the SFU and routes SFU responses back to the
 * originating client using a generated `reqId`.
 *
 * Requirements: - Add dependency: spring-boot-starter-websocket - SFU WS
 * running at ws://localhost:4000/sfu
 */
@Component
public class SfuBridge {

    private static final URI SFU_URI = URI.create("ws://localhost:4000/sfu");

    private final ObjectMapper om = new ObjectMapper();

    /**
     * Holds the active connection to SFU (Spring -> Node). It can be null
     * briefly during reconnects.
     */
    private final AtomicReference<WebSocketSession> sfuSessionRef = new AtomicReference<>();

    /**
     * reqId -> origin client session
     */
    private final ConcurrentHashMap<String, WebSocketSession> pendingByReqId = new ConcurrentHashMap<>();

    /**
     * Keeps the connection alive (auto-reconnect enabled).
     */
    private final WebSocketConnectionManager connectionManager;

    public SfuBridge() {
        var client = new StandardWebSocketClient();

        this.connectionManager = new WebSocketConnectionManager(client, new TextWebSocketHandler() {
            @Override
            public void afterConnectionEstablished(WebSocketSession session) {
                sfuSessionRef.set(session);
            }

            @Override
            protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
                handleSfuMessage(message.getPayload());
            }

            @Override
            public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status) {
                // drop current reference; manager will reconnect
                sfuSessionRef.compareAndSet(session, null);
            }
        }, SFU_URI.toString());

        // ✅ reconnection
        this.connectionManager.setAutoStartup(true);
        this.connectionManager.start();
    }

    /**
     * Optional hooks: you can notify SFU of joins/leaves if your SFU protocol
     * needs it.
     */
    public void onJoin(String roomId, Long userId) {
        // no-op by default
    }

    public void onLeave(String roomId, Long userId) {
        // no-op by default
    }

    public void onDisconnect(Long userId) {
        // no-op by default
    }

    /**
     * Forwards a JSON payload from a client to SFU. Adds: reqId, roomId, userId
     */
    public void forward(String roomId, Long userId, WebSocketSession origin, String payload) throws IOException {
        var sfu = sfuSessionRef.get();
        if (sfu == null || !sfu.isOpen()) {
            throw new IOException("SFU_NOT_CONNECTED");
        }

        String reqId = UUID.randomUUID().toString();

        Map<String, Object> msg = om.readValue(payload, new TypeReference<Map<String, Object>>() {
        });
        msg.put("reqId", reqId);
        msg.put("roomId", roomId);
        msg.put("userId", userId);

        pendingByReqId.put(reqId, origin);

        sfu.sendMessage(new TextMessage(om.writeValueAsString(msg)));
    }

    /**
     * Routes SFU responses back to the origin client if reqId is present. If no
     * reqId, it's an event/broadcast (not implemented here).
     */
    private void handleSfuMessage(String json) throws IOException {
        Map<String, Object> msg = om.readValue(json, new TypeReference<Map<String, Object>>() {
        });
        Object reqIdObj = msg.get("reqId");

        if (reqIdObj instanceof String reqId) {
            WebSocketSession origin = pendingByReqId.remove(reqId);
            if (origin != null && origin.isOpen()) {
                origin.sendMessage(new TextMessage(json));
            }
            return;
        }

    }
}
