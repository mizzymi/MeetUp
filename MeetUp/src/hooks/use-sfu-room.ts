import { useEffect, useRef, useState, useCallback } from "react";
import * as mediasoupClient from "mediasoup-client";
import { getToken } from "@/lib/auth/token";

type RemoteTrack = { producerId: string; stream: MediaStream; kind: "audio" | "video" };

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

    const syncLocalStream = useCallback(() => {
        const tracks: MediaStreamTrack[] = [];
        if (audioProducerRef.current?.track) tracks.push(audioProducerRef.current.track);
        if (videoProducerRef.current?.track) tracks.push(videoProducerRef.current.track);

        if (!tracks.length) {
            setLocalStream(null);
            return;
        }
        setLocalStream(new MediaStream(tracks));
    }, []);

    async function produceIfPossible(kind: "audio" | "video", track: MediaStreamTrack) {
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
    }

    /**
     * Enable/disable mic while joined
     * - If producer exists: pause/resume
     * - If enabling without producer: getUserMedia(audio) + produce
     */
    const setMicEnabled = useCallback(
        async (enabled: boolean, deviceId?: string) => {
            if (!joined) return;

            const p = audioProducerRef.current;

            if (!enabled) {
                try {
                    await p?.pause();
                } catch { }
                syncLocalStream();
                return;
            }

            if (p) {
                try {
                    await p.resume();
                } catch { }
                syncLocalStream();
                return;
            }

            const ms = await navigator.mediaDevices.getUserMedia({
                audio: deviceId ? { deviceId: { exact: deviceId } } : true,
                video: false,
            });
            const track = ms.getAudioTracks()[0];
            if (!track) return;

            await produceIfPossible("audio", track);
        },
        [joined, produceIfPossible, syncLocalStream]
    );

    /**
     * Enable/disable camera while joined
     * - If producer exists: pause/resume (y opcionalmente stop track al apagar)
     * - If enabling without producer: getUserMedia(video) + produce
     */
    const setCamEnabled = useCallback(
        async (enabled: boolean, deviceId?: string) => {
            if (!joined) return;

            const p = videoProducerRef.current;

            if (!enabled) {
                try {
                    await p?.pause();
                } catch { }

                syncLocalStream();
                return;
            }

            if (p) {
                try {
                    await p.resume();
                } catch { }
                syncLocalStream();
                return;
            }

            const ms = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: deviceId ? { deviceId: { exact: deviceId } } : true,
            });
            const track = ms.getVideoTracks()[0];
            if (!track) return;

            await produceIfPossible("video", track);
        },
        [joined, produceIfPossible, syncLocalStream]
    );

    async function join({
        micOn,
        camOn,
        stream: providedStream,
    }: {
        micOn: boolean;
        camOn: boolean;
        stream?: MediaStream | null;
    }) {
        const token = getToken();
        if (!token) throw new Error("NO_TOKEN");

        const rid = (roomId || "").trim();
        if (!rid) throw new Error("NO_ROOM_ID");

        await leave();

        const ws = new WebSocket("ws://localhost:4000/sfu");
        wsRef.current = ws;

        await new Promise<void>((res, rej) => {
            ws.onopen = () => {
                console.log("[SFU] ws open");
                res();
            };
            ws.onerror = (e) => {
                console.error("[SFU] ws error", e);
                rej(new Error("WS_ERROR"));
            };
            ws.onclose = (ev) => {
                console.warn("[SFU] ws close", ev.code, ev.reason);
            };
        });

        const capsRes = await req({ type: "RTPCAPS_REQUEST" });
        const rtpCaps = capsRes?.rtpCapabilities;
        if (!rtpCaps || typeof rtpCaps !== "object") throw new Error("BAD_RTP_CAPS");

        const device = new mediasoupClient.Device();
        await device.load({ routerRtpCapabilities: rtpCaps });
        deviceRef.current = device;

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

        const recvT = await req({ type: "CREATE_TRANSPORT", direction: "recv" });
        const recvTransport = device.createRecvTransport(recvT.params);
        recvTransportRef.current = recvTransport;

        recvTransport.on("connect", ({ dtlsParameters }, cb, errCb) => {
            req({ type: "CONNECT_TRANSPORT", transportId: recvTransport.id, dtlsParameters })
                .then(() => cb())
                .catch((e) => errCb(e));
        });

        setJoined(true);

        const providedAudio = providedStream?.getAudioTracks?.()[0] ?? null;
        const providedVideo = providedStream?.getVideoTracks?.()[0] ?? null;

        if (micOn) {
            if (providedAudio) {
                await produceIfPossible("audio", providedAudio);
            } else {
                await setMicEnabled(true);
            }
        }

        if (camOn) {
            if (providedVideo) {
                await produceIfPossible("video", providedVideo);
            } else {
                await setCamEnabled(true);
            }
        }

        const onWsMessage = async (ev: MessageEvent) => {
            let data: any;
            try {
                data = JSON.parse(ev.data);
            } catch {
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

    async function leave() {
        const ws = wsRef.current;

        try {
            if (ws && messageHandlerRef.current) ws.removeEventListener("message", messageHandlerRef.current);
        } catch { }
        messageHandlerRef.current = null;

        try {
            audioProducerRef.current?.close();
        } catch { }
        try {
            videoProducerRef.current?.close();
        } catch { }

        try {
            audioProducerRef.current?.track?.stop();
        } catch { }
        try {
            videoProducerRef.current?.track?.stop();
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
