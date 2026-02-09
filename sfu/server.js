import { WebSocketServer } from "ws";
import * as mediasoup from "mediasoup";

const wss = new WebSocketServer({ port: 4000, path: "/sfu" });

const worker = await mediasoup.createWorker();
worker.on("died", () => process.exit(1));

/**
 * rooms: roomId -> { router, peers: Map<userId, Peer> }
 * Peer: { transports: Map, producers: Map, consumers: Map }
 */
const rooms = new Map();

/**
 * Track which room/user a ws belongs to (so we can broadcast by room)
 */
function wsIsOpen(ws) {
    return ws.readyState === 1; // WebSocket.OPEN
}

function broadcastToRoom(roomId, exceptWs, payload) {
    const msg = JSON.stringify(payload);
    for (const client of wss.clients) {
        if (!wsIsOpen(client)) continue;
        if (client.roomId !== roomId) continue;
        if (exceptWs && client === exceptWs) continue;
        client.send(msg);
    }
}

async function getRoom(roomId) {
    let room = rooms.get(roomId);
    if (room) return room;

    const mediaCodecs = [
        { kind: "audio", mimeType: "audio/opus", clockRate: 48000, channels: 2 },
        { kind: "video", mimeType: "video/VP8", clockRate: 90000 },
    ];

    const router = await worker.createRouter({ mediaCodecs });
    room = { router, peers: new Map() };
    rooms.set(roomId, room);
    return room;
}

function ensurePeer(room, userId) {
    let peer = room.peers.get(userId);
    if (!peer) {
        peer = { transports: new Map(), producers: new Map(), consumers: new Map() };
        room.peers.set(userId, peer);
    }
    return peer;
}

function safeClose(entity) {
    try {
        entity?.close?.();
    } catch { }
}

function cleanupPeer(room, userId) {
    const peer = room?.peers?.get(userId);
    if (!peer) return;

    // Close consumers
    for (const consumer of peer.consumers.values()) safeClose(consumer);
    peer.consumers.clear();

    // Close producers
    for (const producer of peer.producers.values()) safeClose(producer);
    peer.producers.clear();

    // Close transports
    for (const transport of peer.transports.values()) safeClose(transport);
    peer.transports.clear();

    room.peers.delete(userId);
}

wss.on("connection", (ws) => {
    // store mapping on socket
    ws.roomId = null;
    ws.userId = null;

    ws.on("close", () => {
        const roomId = ws.roomId;
        const userId = ws.userId;
        if (!roomId || !userId) return;

        const room = rooms.get(roomId);
        if (!room) return;

        // Before cleanup, broadcast closures for all producers of this peer
        const peer = room.peers.get(userId);
        if (peer) {
            for (const producerId of peer.producers.keys()) {
                broadcastToRoom(roomId, ws, {
                    type: "PRODUCER_CLOSED",
                    roomId,
                    userId,
                    producerId,
                });
            }
        }

        cleanupPeer(room, userId);

        // Optional: delete room if empty
        if (room.peers.size === 0) {
            rooms.delete(roomId);
        }
    });

    ws.on("message", async (buf) => {
        const msg = JSON.parse(buf.toString());
        const { type, roomId, userId, reqId } = msg;

        const reply = (payload) => ws.send(JSON.stringify({ reqId, ...payload }));

        try {
            if (!roomId) {
                reply({ type: "ERROR", error: "NO_ROOM_ID" });
                return;
            }

            const room = await getRoom(roomId);

            // Bind ws to room early (for correct broadcasting)
            ws.roomId = roomId;

            if (type === "RTPCAPS_REQUEST") {
                reply({
                    type: "RTPCAPS_RESPONSE",
                    roomId,
                    rtpCapabilities: room.router.rtpCapabilities,
                });
                return;
            }

            if (!userId) {
                reply({ type: "ERROR", error: "NO_USER_ID" });
                return;
            }

            ws.userId = userId;

            if (type === "CREATE_TRANSPORT") {
                const { direction } = msg;

                const transport = await room.router.createWebRtcTransport({
                    listenIps: [{ ip: "127.0.0.1", announcedIp: null }],
                    enableUdp: true,
                    enableTcp: true,
                    preferUdp: true,
                });

                const peer = ensurePeer(room, userId);
                peer.transports.set(transport.id, transport);

                reply({
                    type: "TRANSPORT_CREATED",
                    roomId,
                    direction,
                    params: {
                        id: transport.id,
                        iceParameters: transport.iceParameters,
                        iceCandidates: transport.iceCandidates,
                        dtlsParameters: transport.dtlsParameters,
                    },
                });
                return;
            }

            if (type === "CONNECT_TRANSPORT") {
                const peer = room.peers.get(userId);
                const transport = peer?.transports.get(msg.transportId);
                if (!transport) {
                    reply({ type: "ERROR", error: "TRANSPORT_NOT_FOUND" });
                    return;
                }
                await transport.connect({ dtlsParameters: msg.dtlsParameters });
                reply({ type: "TRANSPORT_CONNECTED", transportId: transport.id });
                return;
            }

            if (type === "PRODUCE") {
                const peer = room.peers.get(userId);
                const transport = peer?.transports.get(msg.transportId);
                if (!transport) {
                    reply({ type: "ERROR", error: "TRANSPORT_NOT_FOUND" });
                    return;
                }

                const producer = await transport.produce({
                    kind: msg.kind,
                    rtpParameters: msg.rtpParameters,
                });

                peer.producers.set(producer.id, producer);

                // When producer closes, broadcast it
                producer.on("transportclose", () => {
                    peer.producers.delete(producer.id);
                    broadcastToRoom(roomId, ws, {
                        type: "PRODUCER_CLOSED",
                        roomId,
                        userId,
                        producerId: producer.id,
                    });
                });

                producer.on("close", () => {
                    peer.producers.delete(producer.id);
                    broadcastToRoom(roomId, ws, {
                        type: "PRODUCER_CLOSED",
                        roomId,
                        userId,
                        producerId: producer.id,
                    });
                });

                reply({ type: "PRODUCED", producerId: producer.id });

                // ✅ broadcast only to same room
                broadcastToRoom(roomId, ws, {
                    type: "NEW_PRODUCER",
                    roomId,
                    producerId: producer.id,
                    userId,
                });

                return;
            }

            // ✅ NEW: Close producer explicitly (used when user turns cam/mic OFF for real)
            if (type === "CLOSE_PRODUCER") {
                const peer = room.peers.get(userId);
                const producer = peer?.producers.get(msg.producerId);
                if (!producer) {
                    reply({ type: "ERROR", error: "PRODUCER_NOT_FOUND" });
                    return;
                }

                // close it
                safeClose(producer);
                peer.producers.delete(msg.producerId);

                reply({ type: "PRODUCER_CLOSED_ACK", producerId: msg.producerId });

                // notify others
                broadcastToRoom(roomId, ws, {
                    type: "PRODUCER_CLOSED",
                    roomId,
                    userId,
                    producerId: msg.producerId,
                });

                return;
            }

            if (type === "CONSUME") {
                const peer = room.peers.get(userId);
                const transport = peer?.transports.get(msg.transportId);
                if (!transport) {
                    reply({ type: "ERROR", error: "TRANSPORT_NOT_FOUND" });
                    return;
                }

                if (!room.router.canConsume({ producerId: msg.producerId, rtpCapabilities: msg.rtpCapabilities })) {
                    reply({ type: "ERROR", error: "CANNOT_CONSUME" });
                    return;
                }

                const consumer = await transport.consume({
                    producerId: msg.producerId,
                    rtpCapabilities: msg.rtpCapabilities,
                    paused: true,
                });

                peer.consumers.set(consumer.id, consumer);

                // If producer goes away, consumer will close; keep map clean
                consumer.on("transportclose", () => peer.consumers.delete(consumer.id));
                consumer.on("producerclose", () => peer.consumers.delete(consumer.id));
                consumer.on("close", () => peer.consumers.delete(consumer.id));

                reply({
                    type: "CONSUMED",
                    consumerId: consumer.id,
                    producerId: msg.producerId,
                    kind: consumer.kind,
                    rtpParameters: consumer.rtpParameters,
                });
                return;
            }

            if (type === "RESUME_CONSUMER") {
                const peer = room.peers.get(userId);
                const consumer = peer?.consumers.get(msg.consumerId);
                if (!consumer) {
                    reply({ type: "ERROR", error: "CONSUMER_NOT_FOUND" });
                    return;
                }
                await consumer.resume();
                reply({ type: "CONSUMER_RESUMED", consumerId: consumer.id });
                return;
            }

            reply({ type: "ERROR", error: "UNKNOWN_TYPE" });
        } catch (e) {
            ws.send(JSON.stringify({ reqId, type: "ERROR", error: String(e?.message ?? e) }));
        }
    });
});

console.log("mediasoup SFU listening ws://localhost:4000/sfu");
