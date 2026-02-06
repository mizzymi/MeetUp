import { WebSocketServer } from "ws";
import * as mediasoup from "mediasoup";

const wss = new WebSocketServer({ port: 4000, path: "/sfu" });

const worker = await mediasoup.createWorker();
worker.on("died", () => process.exit(1));

const rooms = new Map();

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

wss.on("connection", (ws) => {
    ws.on("message", async (buf) => {
        const msg = JSON.parse(buf.toString());
        const { type, roomId, userId, reqId } = msg;

        try {
            if (!roomId) {
                ws.send(JSON.stringify({ reqId, type: "ERROR", error: "NO_ROOM_ID" }));
                return;
            }

            const room = await getRoom(roomId);

            if (type === "RTPCAPS_REQUEST") {
                ws.send(
                    JSON.stringify({
                        reqId,
                        type: "RTPCAPS_RESPONSE",
                        roomId,
                        rtpCapabilities: room.router.rtpCapabilities,
                    })
                );
                return;
            }

            if (!userId) {
                ws.send(JSON.stringify({ reqId, type: "ERROR", error: "NO_USER_ID" }));
                return;
            }

            if (type === "CREATE_TRANSPORT") {
                const { direction } = msg;

                const transport = await room.router.createWebRtcTransport({
                    listenIps: [{ ip: "127.0.0.1", announcedIp: null }],
                    enableUdp: true,
                    enableTcp: true,
                    preferUdp: true,
                });

                let peer = room.peers.get(userId);
                if (!peer) {
                    peer = { transports: new Map(), producers: new Map(), consumers: new Map() };
                    room.peers.set(userId, peer);
                }
                peer.transports.set(transport.id, transport);

                ws.send(
                    JSON.stringify({
                        reqId,
                        type: "TRANSPORT_CREATED",
                        roomId,
                        direction,
                        params: {
                            id: transport.id,
                            iceParameters: transport.iceParameters,
                            iceCandidates: transport.iceCandidates,
                            dtlsParameters: transport.dtlsParameters,
                        },
                    })
                );
                return;
            }

            if (type === "CONNECT_TRANSPORT") {
                const peer = room.peers.get(userId);
                const transport = peer?.transports.get(msg.transportId);
                if (!transport) {
                    ws.send(JSON.stringify({ reqId, type: "ERROR", error: "TRANSPORT_NOT_FOUND" }));
                    return;
                }
                await transport.connect({ dtlsParameters: msg.dtlsParameters });
                ws.send(JSON.stringify({ reqId, type: "TRANSPORT_CONNECTED", transportId: transport.id }));
                return;
            }

            if (type === "PRODUCE") {
                const peer = room.peers.get(userId);
                const transport = peer?.transports.get(msg.transportId);
                if (!transport) {
                    ws.send(JSON.stringify({ reqId, type: "ERROR", error: "TRANSPORT_NOT_FOUND" }));
                    return;
                }

                const producer = await transport.produce({ kind: msg.kind, rtpParameters: msg.rtpParameters });
                peer.producers.set(producer.id, producer);

                ws.send(JSON.stringify({ reqId, type: "PRODUCED", producerId: producer.id }));

                for (const client of wss.clients) {
                    if (client !== ws && client.readyState === 1) {
                        client.send(JSON.stringify({ type: "NEW_PRODUCER", roomId, producerId: producer.id, userId }));
                    }
                }
                return;
            }

            if (type === "CONSUME") {
                const peer = room.peers.get(userId);
                const transport = peer?.transports.get(msg.transportId);
                if (!transport) {
                    ws.send(JSON.stringify({ reqId, type: "ERROR", error: "TRANSPORT_NOT_FOUND" }));
                    return;
                }

                if (!room.router.canConsume({ producerId: msg.producerId, rtpCapabilities: msg.rtpCapabilities })) {
                    ws.send(JSON.stringify({ reqId, type: "ERROR", error: "CANNOT_CONSUME" }));
                    return;
                }

                const consumer = await transport.consume({
                    producerId: msg.producerId,
                    rtpCapabilities: msg.rtpCapabilities,
                    paused: true,
                });

                peer.consumers.set(consumer.id, consumer);

                ws.send(
                    JSON.stringify({
                        reqId,
                        type: "CONSUMED",
                        consumerId: consumer.id,
                        producerId: msg.producerId,
                        kind: consumer.kind,
                        rtpParameters: consumer.rtpParameters,
                    })
                );
                return;
            }

            if (type === "RESUME_CONSUMER") {
                const peer = room.peers.get(userId);
                const consumer = peer?.consumers.get(msg.consumerId);
                if (!consumer) {
                    ws.send(JSON.stringify({ reqId, type: "ERROR", error: "CONSUMER_NOT_FOUND" }));
                    return;
                }
                await consumer.resume();
                ws.send(JSON.stringify({ reqId, type: "CONSUMER_RESUMED", consumerId: msg.consumerId }));
                return;
            }

            ws.send(JSON.stringify({ reqId, type: "ERROR", error: "UNKNOWN_TYPE" }));
        } catch (e) {
            ws.send(JSON.stringify({ reqId, type: "ERROR", error: String(e?.message ?? e) }));
        }
    });
});

console.log("mediasoup SFU listening ws://localhost:4000/sfu");
