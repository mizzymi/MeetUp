import { useCallback, useEffect, useRef, useState } from "react";
import * as mediasoupClient from "mediasoup-client";
import { getToken } from "@/lib/auth/token";

type RemoteTrack = { producerId: string; stream: MediaStream; kind: "audio" | "video" };

type JoinArgs = {
    micOn: boolean;
    camOn: boolean;

    /**
     * Optional pre-join preview stream (from PreJoin).
     *
     * IMPORTANT:
     * - We will CLONE tracks from this stream for mediasoup producers.
     * - Then we STOP the original preview tracks to avoid leaving the camera LED on.
     */
    stream?: MediaStream | null;

    /** Optional device ids if you want to start producing with specific devices */
    audioDeviceId?: string;
    videoDeviceId?: string;
};

/**
 * useSfuRoom
 *
 * A lightweight mediasoup-client SFU hook with WS signaling.
 *
 * Features:
 * - Join/leave a room
 * - Create send/recv transports
 * - Produce audio/video (and toggle them while joined)
 * - Consume remote producers announced over WS
 * - Expose a localStream for UI (built from current producer tracks)
 *
 * Key reliability rule:
 * - When joining using a pre-join preview stream, ALWAYS produce from track.clone()
 *   and stop the original preview tracks. This prevents orphaned captures keeping
 *   the camera LED ON after you transition into the call or switch tabs.
 */
export function useSfuRoom(roomId: string) {
    const wsRef = useRef<WebSocket | null>(null);
    const userIdRef = useRef<string>(crypto.randomUUID());

    const deviceRef = useRef<mediasoupClient.types.Device | null>(null);
    const sendTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
    const recvTransportRef = useRef<mediasoupClient.types.Transport | null>(null);

    const messageHandlerRef = useRef<((ev: MessageEvent) => void) | null>(null);

    const audioProducerRef = useRef<mediasoupClient.types.Producer | null>(null);
    const videoProducerRef = useRef<mediasoupClient.types.Producer | null>(null);

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteTracks, setRemoteTracks] = useState<RemoteTrack[]>([]);
    const [joined, setJoined] = useState(false);
    const joinedRef = useRef(false);

    useEffect(() => {
        joinedRef.current = joined;
    }, [joined]);

    /** Stop all tracks from a stream (hard release of camera/mic). */
    const stopStream = useCallback((s?: MediaStream | null) => {
        try {
            s?.getTracks?.().forEach((t) => t.stop());
        } catch { }
    }, []);

    /**
     * WS request/response helper (reqId-based).
     * Server should echo reqId in the response.
     */
    function req(payload: any): Promise<any> {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            return Promise.reject(new Error("WS_NOT_OPEN"));
        }

        const reqId = crypto.randomUUID();
        const msg = { ...payload, reqId, roomId, userId: userIdRef.current };

        return new Promise((resolve, reject) => {
            let done = false;

            const cleanup = () => {
                ws.removeEventListener("message", onMessage);
                ws.removeEventListener("close", onClose);
            };

            const onClose = () => {
                if (done) return;
                done = true;
                cleanup();
                reject(new Error("WS_CLOSED"));
            };

            const onMessage = (ev: MessageEvent) => {
                let data: any;
                try {
                    data = JSON.parse(ev.data);
                } catch {
                    return;
                }
                if (data.reqId !== reqId) return;

                if (done) return;
                done = true;
                cleanup();

                if (data.type === "ERROR") reject(new Error(data.error));
                else resolve(data);
            };

            ws.addEventListener("message", onMessage);
            ws.addEventListener("close", onClose);
            ws.send(JSON.stringify(msg));
        });
    }

    /**
     * Rebuild localStream (UI stream) from current producers' tracks.
     * Anti-flicker: only replace stream if track ids change.
     */
    const syncLocalStream = useCallback(() => {
        const a = audioProducerRef.current?.track ?? null;
        const v = videoProducerRef.current?.track ?? null;

        setLocalStream((prev) => {
            const prevA = prev?.getAudioTracks?.()[0] ?? null;
            const prevV = prev?.getVideoTracks?.()[0] ?? null;

            const sameAudio = (!prevA && !a) || prevA?.id === a?.id;
            const sameVideo = (!prevV && !v) || prevV?.id === v?.id;

            if (prev && sameAudio && sameVideo) return prev;
            if (!a && !v) return null;

            const tracks: MediaStreamTrack[] = [];
            if (a) tracks.push(a);
            if (v) tracks.push(v);
            return new MediaStream(tracks);
        });
    }, []);

    /**
     * Best-effort: request server to close producer (optional, server must support it).
     */
    const closeProducerRemote = useCallback(async (producerId: string) => {
        try {
            await req({ type: "CLOSE_PRODUCER", producerId });
        } catch { }
    }, []);

    /**
     * Produce a track on the send transport.
     */
    const produce = useCallback(
        async (kind: "audio" | "video", track: MediaStreamTrack) => {
            const sendTransport = sendTransportRef.current;
            if (!sendTransport) throw new Error("NO_SEND_TRANSPORT");

            const producer = await sendTransport.produce({ track });

            if (kind === "audio") audioProducerRef.current = producer;
            else videoProducerRef.current = producer;

            producer.on("transportclose", () => {
                if (kind === "audio") audioProducerRef.current = null;
                else videoProducerRef.current = null;
                syncLocalStream();
            });

            producer.on("trackended", () => {
                try {
                    producer.close();
                } catch { }
                if (kind === "audio") audioProducerRef.current = null;
                else videoProducerRef.current = null;
                syncLocalStream();
            });

            syncLocalStream();
            return producer;
        },
        [syncLocalStream]
    );

    /**
     * Toggle microphone while joined.
     * - OFF => stop+close producer (hardware release)
     * - ON  => capture new audio track and produce it
     */
    const setMicEnabled = useCallback(
        async (enabled: boolean, deviceId?: string) => {
            if (!joinedRef.current) return;

            const p = audioProducerRef.current;

            if (!enabled) {
                if (!p) return;
                const pid = p.id;

                try {
                    p.track?.stop();
                } catch { }
                try {
                    p.close();
                } catch { }

                audioProducerRef.current = null;
                syncLocalStream();
                void closeProducerRemote(pid);
                return;
            }

            if (p?.track && p.track.readyState === "live") {
                syncLocalStream();
                return;
            }

            const ms = await navigator.mediaDevices.getUserMedia({
                audio: deviceId ? { deviceId: { exact: deviceId } } : true,
                video: false,
            });

            const track = ms.getAudioTracks()[0];
            if (!track) return;

            await produce("audio", track);
        },
        [joined, closeProducerRemote, syncLocalStream, produce]
    );

    /**
     * Toggle camera while joined.
     * - OFF => stop+close producer (hardware release, LED off)
     * - ON  => capture new video track and produce it
     */
    const setCamEnabled = useCallback(
        async (enabled: boolean, deviceId?: string) => {
            if (!joinedRef.current) return;

            const p = videoProducerRef.current;

            if (!enabled) {
                if (!p) return;
                const pid = p.id;

                try {
                    p.track?.stop(); // LED off
                } catch { }
                try {
                    p.close();
                } catch { }

                videoProducerRef.current = null;
                syncLocalStream();
                void closeProducerRemote(pid);
                return;
            }

            if (p?.track && p.track.readyState === "live") {
                syncLocalStream();
                return;
            }

            const ms = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: deviceId ? { deviceId: { exact: deviceId } } : true,
            });

            const track = ms.getVideoTracks()[0];
            if (!track) return;

            await produce("video", track);
        },
        [joined, closeProducerRemote, syncLocalStream, produce]
    );

    /**
     * Join flow:
     * - Create WS
     * - Load router RTP capabilities into mediasoup Device
     * - Create send/recv transports
     * - Produce initial tracks (from preview stream if available)
     * - Subscribe to server NEW_PRODUCER events and consume them
     */
    async function join({ micOn, camOn, stream: providedStream, audioDeviceId, videoDeviceId }: JoinArgs) {
        const token = getToken();
        if (!token) throw new Error("NO_TOKEN");

        const rid = (roomId || "").trim();
        if (!rid) throw new Error("NO_ROOM_ID");

        await leave();

        const ws = new WebSocket("ws://localhost:4000/sfu");
        wsRef.current = ws;

        await new Promise<void>((res, rej) => {
            ws.onopen = () => res();
            ws.onerror = () => rej(new Error("WS_ERROR"));
            ws.onclose = (ev) => console.warn("[SFU] ws close", ev.code, ev.reason);
        });

        const capsRes = await req({ type: "RTPCAPS_REQUEST" });
        const rtpCaps = capsRes?.rtpCapabilities;
        if (!rtpCaps || typeof rtpCaps !== "object") throw new Error("BAD_RTP_CAPS");

        const device = new mediasoupClient.Device();
        await device.load({ routerRtpCapabilities: rtpCaps });
        deviceRef.current = device;

        // SEND transport
        const sendT = await req({ type: "CREATE_TRANSPORT", direction: "send" });
        const sendTransport = device.createSendTransport(sendT.params);
        sendTransportRef.current = sendTransport;

        sendTransport.on("connect", ({ dtlsParameters }, cb, errCb) => {
            req({ type: "CONNECT_TRANSPORT", transportId: sendTransport.id, dtlsParameters })
                .then(() => cb())
                .catch((e) => errCb(e));
        });

        sendTransport.on("produce", ({ kind, rtpParameters }, cb, errCb) => {
            req({ type: "PRODUCE", transportId: sendTransport.id, kind, rtpParameters })
                .then((r) => cb({ id: r.producerId }))
                .catch((e) => errCb(e));
        });

        // RECV transport
        const recvT = await req({ type: "CREATE_TRANSPORT", direction: "recv" });
        const recvTransport = device.createRecvTransport(recvT.params);
        recvTransportRef.current = recvTransport;

        recvTransport.on("connect", ({ dtlsParameters }, cb, errCb) => {
            req({ type: "CONNECT_TRANSPORT", transportId: recvTransport.id, dtlsParameters })
                .then(() => cb())
                .catch((e) => errCb(e));
        });

        setJoined(true);

        joinedRef.current = true;
        setJoined(true);

        // Initial produce
        const providedAudio = providedStream?.getAudioTracks?.()[0] ?? null;
        const providedVideo = providedStream?.getVideoTracks?.()[0] ?? null;

        // ✅ Produce from CLONES (never from the original preview track)
        if (micOn) {
            if (providedAudio && providedAudio.readyState === "live") {
                await produce("audio", providedAudio.clone());
            } else {
                await setMicEnabled(true, audioDeviceId);
            }
        }

        if (camOn) {
            if (providedVideo && providedVideo.readyState === "live") {
                await produce("video", providedVideo.clone());
            } else {
                await setCamEnabled(true, videoDeviceId);
            }
        }

        // WS consume flow
        const onWsMessage = async (ev: MessageEvent) => {
            let data: any;
            try {
                data = JSON.parse(ev.data);
            } catch {
                return;
            }

            // Optional: if server emits producer close events
            if (data.type === "PRODUCER_CLOSED") {
                setRemoteTracks((prev) => prev.filter((t) => t.producerId !== data.producerId));
                return;
            }

            if (data.type !== "NEW_PRODUCER") return;
            if (data.roomId !== rid) return;

            try {
                const dev = deviceRef.current;
                const rt = recvTransportRef.current;
                if (!dev || !rt) return;

                const consumeRes = await req({
                    type: "CONSUME",
                    transportId: rt.id,
                    producerId: data.producerId,
                    rtpCapabilities: dev.rtpCapabilities,
                });

                const consumer = await rt.consume({
                    id: consumeRes.consumerId,
                    producerId: consumeRes.producerId,
                    kind: consumeRes.kind,
                    rtpParameters: consumeRes.rtpParameters,
                });

                const ms = new MediaStream([consumer.track]);
                setRemoteTracks((prev) => [
                    ...prev,
                    { producerId: data.producerId, stream: ms, kind: consumer.kind },
                ]);

                await req({ type: "RESUME_CONSUMER", consumerId: consumer.id });
            } catch (e) {
                console.error("[SFU] consume flow failed:", e);
            }
        };

        if (messageHandlerRef.current) ws.removeEventListener("message", messageHandlerRef.current);
        messageHandlerRef.current = onWsMessage;
        ws.addEventListener("message", onWsMessage);

        syncLocalStream();
    }

    /**
     * Leave flow:
     * - Stop+close producers (hardware release)
     * - Close transports
     * - Close WS
     * - Reset state
     */
    async function leave() {
        const ws = wsRef.current;

        joinedRef.current = false;
        setJoined(false);

        try {
            if (ws && messageHandlerRef.current) ws.removeEventListener("message", messageHandlerRef.current);
        } catch { }
        messageHandlerRef.current = null;

        try {
            audioProducerRef.current?.track?.stop();
            audioProducerRef.current?.close();
        } catch { }
        try {
            videoProducerRef.current?.track?.stop();
            videoProducerRef.current?.close();
        } catch { }

        audioProducerRef.current = null;
        videoProducerRef.current = null;

        try {
            sendTransportRef.current?.close();
        } catch { }
        try {
            recvTransportRef.current?.close();
        } catch { }

        sendTransportRef.current = null;
        recvTransportRef.current = null;
        deviceRef.current = null;

        try {
            ws?.close();
        } catch { }
        wsRef.current = null;

        setLocalStream(null);
        setRemoteTracks([]);
        setJoined(false);
    }

    useEffect(() => {
        return () => {
            void leave();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        joined,
        join,
        leave,
        localStream,
        remoteTracks,
        setMicEnabled,
        setCamEnabled,
    };
}
