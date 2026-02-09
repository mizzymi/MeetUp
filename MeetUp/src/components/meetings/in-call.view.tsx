import { Button } from "@/components/ui/button/button";
import {
    ArrowLeft,
    Mic,
    MicOff,
    Video,
    VideoOff,
    MessageSquare,
    Users,
    LogOut,
    CameraOff,
    MonitorUp,
    MonitorOff,
    Pin,
    PinOff,
} from "lucide-react";
import { Sidebar } from "../sidebar/sidebar";
import { SidebarNavItemData } from "../sidebar/sidebar-nav";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { SidebarUserData } from "../sidebar/sidebar-user";

/**
 * Remote track from your SFU hook.
 * Extend this with real metadata (name/micOn/camOn/isScreen) if your server provides it.
 */
export type RemoteTrack = {
    producerId: string;
    stream: MediaStream;

    /** Optional metadata */
    name?: string;
    micOn?: boolean;
    camOn?: boolean;
    isScreen?: boolean;
};

type Tile = {
    key: string;
    name: string;
    stream: MediaStream | null;
    muted: boolean;
    isLocal?: boolean;
    isScreen?: boolean;
};

type ByteArray = Uint8Array<ArrayBuffer>;

/**
 * Returns true if a MediaStream has at least one LIVE enabled video track.
 */
function hasLiveVideo(stream: MediaStream | null | undefined) {
    const vids = stream?.getVideoTracks?.() ?? [];
    return vids.some((t) => t.readyState === "live" && t.enabled);
}

/**
 * Returns true if a MediaStream has at least one LIVE enabled audio track.
 */
function hasLiveAudio(stream: MediaStream | null | undefined) {
    const auds = stream?.getAudioTracks?.() ?? [];
    return auds.some((t) => t.readyState === "live" && t.enabled);
}

/**
 * Safely attach/detach a MediaStream to a <video>.
 * Prevents stale frames and helps release resources properly.
 */
function attachVideo(el: HTMLVideoElement | null, stream: MediaStream | null) {
    if (!el) return;

    if (!stream) {
        try {
            el.pause();
        } catch { }
        if (el.srcObject) el.srcObject = null;
        return;
    }

    if (el.srcObject !== stream) el.srcObject = stream;
    void el.play().catch(() => { });
}

/**
 * Active speaker detection (client-side, WebAudio).
 *
 * How it works:
 * - For each tile that has a live audio track, create an AnalyserNode.
 * - Every ~200ms compute an RMS "volume" score from time-domain samples.
 * - The loudest speaker above ON_THRESHOLD becomes active.
 * - If nobody is above threshold for a while, we clear the active speaker
 *   (so the green border goes away when you're not talking).
 *
 * Notes:
 * - Best-effort. AGC/noise can affect results.
 * - If your SFU provides dominant-speaker events, prefer those.
 */
export function useActiveSpeaker(tiles: Tile[], enabled: boolean) {
    const [activeKey, setActiveKey] = useState<string | null>(null);

    const ctxRef = useRef<AudioContext | null>(null);
    const timerRef = useRef<number | null>(null);
    const lastLoudAtRef = useRef<number>(0);

    useEffect(() => {
        if (!enabled) {
            setActiveKey(null);
            return;
        }

        const candidates = tiles
            .map((t) => {
                const track = t.stream?.getAudioTracks?.().find((x) => x.readyState === "live");
                return track ? { key: t.key, track } : null;
            })
            .filter(Boolean) as { key: string; track: MediaStreamTrack }[];

        if (candidates.length === 0) {
            setActiveKey(null);
            return;
        }

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx: AudioContext = new AudioCtx();
        ctxRef.current = ctx;

        const analysers = new Map<
            string,
            { analyser: AnalyserNode; data: ByteArray; source: MediaStreamAudioSourceNode }
        >();

        for (const c of candidates) {
            const ms = new MediaStream([c.track]);
            const source = ctx.createMediaStreamSource(ms);

            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512;
            source.connect(analyser);

            // Allocate and cast once to the exact type WebAudio expects.
            const data = new Uint8Array(analyser.fftSize) as unknown as ByteArray;

            analysers.set(c.key, { analyser, data, source });
        }

        // ===== Tunables =====
        const ON_THRESHOLD = 0.02;
        const HOLD_MS = 700;
        const SILENCE_CLEAR_MS = 1200;
        const INTERVAL_MS = 200;

        /** RMS from 8-bit time-domain samples. */
        function computeRms(buf: Uint8Array) {
            let sum = 0;
            for (let i = 0; i < buf.length; i++) {
                const v = (buf[i] - 128) / 128;
                sum += v * v;
            }
            return Math.sqrt(sum / buf.length);
        }

        timerRef.current = window.setInterval(() => {
            let bestKey: string | null = null;
            let best = 0;

            for (const [key, obj] of analysers.entries()) {
                // ✅ no TS error now
                obj.analyser.getByteTimeDomainData(obj.data);
                const rms = computeRms(obj.data);

                if (rms > best) {
                    best = rms;
                    bestKey = key;
                }
            }

            const now = Date.now();

            if (bestKey && best >= ON_THRESHOLD) {
                lastLoudAtRef.current = now;
            }

            setActiveKey((prev) => {
                if (bestKey && best >= ON_THRESHOLD) return bestKey;

                if (prev && now - lastLoudAtRef.current < HOLD_MS) return prev;

                if (prev && now - lastLoudAtRef.current >= SILENCE_CLEAR_MS) return null;

                return prev;
            });
        }, INTERVAL_MS);

        return () => {
            if (timerRef.current) {
                window.clearInterval(timerRef.current);
                timerRef.current = null;
            }

            try {
                analysers.forEach((v) => {
                    try {
                        v.source.disconnect();
                    } catch { }
                    try {
                        v.analyser.disconnect();
                    } catch { }
                });
            } catch { }

            try {
                ctx.close();
            } catch { }

            ctxRef.current = null;
        };
    }, [tiles, enabled]);

    return activeKey;
}

/**
 * Meet-like tile that ALWAYS keeps a 16:9 surface.
 *
 * - If video exists: show video cover.
 * - If no video: show camera-off icon (like your screenshot).
 * - Shows mic muted badge top-left (red).
 * - Shows pin button top-right.
 * - Shows name bottom-left and "En llamada" badge bottom-right.
 * - Optionally highlights if active speaker.
 */
function MeetTile({
    name,
    stream,
    muted,
    pinned,
    isActiveSpeaker,
    onTogglePin,
}: {
    name: string;
    stream: MediaStream | null;
    muted: boolean;
    pinned: boolean;
    isActiveSpeaker: boolean;
    onTogglePin: () => void;
}) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const videoAvailable = useMemo(() => hasLiveVideo(stream), [stream]);

    useEffect(() => {
        attachVideo(videoRef.current, videoAvailable ? stream : null);
    }, [stream, videoAvailable]);

    useEffect(() => {
        return () => attachVideo(videoRef.current, null);
    }, []);

    return (
        <div
            className={[
                "relative h-full w-full overflow-hidden rounded-2xl bg-slate-950/90 shadow-xl",
                "ring-1 ring-white/10",
                isActiveSpeaker ? "outline outline-2 outline-emerald-400/70" : "",
            ].join(" ")}
        >
            {/* 16:9 surface */}
            <div className="absolute inset-0">
                {videoAvailable ? (
                    <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <CameraOff className="h-9 w-9 text-white/60" />
                    </div>
                )}
            </div>

            {/* muted badge */}
            {muted ? (
                <div className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/90 ring-1 ring-red-200/30 shadow">
                    <MicOff className="h-4 w-4 text-white" />
                </div>
            ) : null}

            {/* pin button */}
            <button
                type="button"
                onClick={onTogglePin}
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-black/50 ring-1 ring-white/10 hover:bg-black/60"
                aria-label={pinned ? "Unpin" : "Pin"}
                title={pinned ? "Unpin" : "Pin"}
            >
                {pinned ? <PinOff className="h-4 w-4 text-white/90" /> : <Pin className="h-4 w-4 text-white/90" />}
            </button>

            {/* bottom info bar */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                <div className="truncate text-sm text-white/90">{name}</div>
                <div className="rounded-lg bg-black/50 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10">
                    En llamada
                </div>
            </div>
        </div>
    );
}

type Props = {
    roomId: string;
    meetingTitle: string;

    localStream: MediaStream | null;
    remoteTracks: RemoteTrack[];

    sidebarItems: SidebarNavItemData[];
    sidebarUser: SidebarUserData;

    isMicOn: boolean;
    isCamOn: boolean;

    /** Optional screen share state */
    isScreenSharing?: boolean;

    onBack?: () => void;
    onToggleMic: () => void;
    onToggleCam: () => void;
    onToggleShareScreen?: () => void;

    onOpenChat?: () => void;
    onOpenParticipants?: () => void;
    onLeave: () => void;
};

export function InCallView({
    roomId,
    meetingTitle,
    localStream,
    remoteTracks,
    sidebarItems,
    sidebarUser,
    isMicOn,
    isCamOn,
    isScreenSharing = false,
    onBack,
    onToggleMic,
    onToggleCam,
    onToggleShareScreen,
    onOpenChat,
    onOpenParticipants,
    onLeave,
}: Props) {
    /**
     * Build normalized tiles:
     * - local
     * - remotes
     */
    const tiles = useMemo<Tile[]>(() => {
        const list: Tile[] = [];

        list.push({
            key: "local",
            name: sidebarUser?.name ?? "You",
            stream: localStream,
            muted: !isMicOn || !hasLiveAudio(localStream),
            isLocal: true,
        });

        remoteTracks.forEach((t, i) => {
            list.push({
                key: t.producerId ?? `remote-${i}`,
                name: t.name ?? `User ${i + 1}`,
                stream: t.stream,
                muted: t.micOn === false || !hasLiveAudio(t.stream),
                isScreen: !!t.isScreen,
            });
        });

        return list;
    }, [remoteTracks, localStream, sidebarUser?.name, isMicOn]);

    /**
     * PINNING
     * - Users can pin one or multiple tiles.
     * - Pinned tiles always go to the stage area.
     */
    const [pinnedKeys, setPinnedKeys] = useState<string[]>([]);

    const togglePin = useCallback((key: string) => {
        setPinnedKeys((prev) => {
            if (prev.includes(key)) return prev.filter((x) => x !== key);
            return [...prev, key];
        });
    }, []);

    // Remove pins that no longer exist (participant left).
    useEffect(() => {
        const keys = new Set(tiles.map((t) => t.key));
        setPinnedKeys((prev) => prev.filter((k) => keys.has(k)));
    }, [tiles]);

    /**
     * Active speaker
     * - Enabled only when there are NO pins (pins override active speaker).
     * - Also if a screen-share exists, you might prefer to always stage it.
     */
    const activeSpeakerKey = useActiveSpeaker(tiles, pinnedKeys.length === 0);

    /**
     * Stage selection rules:
     * 1) If there is screen share: prefer it in stage (unless user pinned others).
     * 2) If pinnedKeys has items: stage = pinned tiles (in pinned order).
     * 3) Else: stage = active speaker (fallback to first remote with video, else local).
     */
    const stageTiles = useMemo<Tile[]>(() => {
        // (1) screen share suggestion
        const screenTile = tiles.find((t) => t.isScreen && hasLiveVideo(t.stream));
        if (pinnedKeys.length === 0 && screenTile) return [screenTile];

        // (2) pinned
        if (pinnedKeys.length > 0) {
            const byKey = new Map(tiles.map((t) => [t.key, t] as const));
            return pinnedKeys.map((k) => byKey.get(k)).filter(Boolean) as Tile[];
        }

        // (3) active speaker
        if (activeSpeakerKey) {
            const found = tiles.find((t) => t.key === activeSpeakerKey);
            if (found) return [found];
        }

        // fallback: first remote with video
        const firstRemoteVideo = tiles.find((t) => !t.isLocal && hasLiveVideo(t.stream));
        if (firstRemoteVideo) return [firstRemoteVideo];

        // fallback: local
        return tiles[0] ? [tiles[0]] : [];
    }, [tiles, pinnedKeys, activeSpeakerKey]);

    /**
     * Filmstrip = everyone not in stageTiles.
     */
    const filmstripTiles = useMemo(() => {
        const stageSet = new Set(stageTiles.map((t) => t.key));
        return tiles.filter((t) => !stageSet.has(t.key));
    }, [tiles, stageTiles]);

    /**
     * Layout decisions:
     * - If only 1 participant -> show as a single big stage tile.
     * - If stageTiles has 1 -> big stage.
     * - If stageTiles has >1 -> stage grid (2 columns) like Meet when multiple pins.
     */
    const isSolo = tiles.length <= 1;

    return (
        <div className="flex min-h-dvh">
            <Sidebar items={sidebarItems} user={sidebarUser} />

            <div className="w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-4">
                    <Button
                        intent="neutral"
                        size="sm"
                        showText={false}
                        leftIcon={ArrowLeft}
                        onClick={onBack}
                        className="h-9 w-9 px-0"
                        aria-label="Back"
                        title="Back"
                    />

                    <div className="min-w-0">
                        <div className="truncate text-xl font-semibold text-slate-900">{meetingTitle}</div>
                        <div className="truncate text-sm text-slate-500">
                            Room: <span className="font-mono">{roomId}</span>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="relative flex h-[calc(100vh-76px)] flex-col bg-white">
                    <div className="relative flex-1 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                        <div className="relative h-full w-full p-6">
                            {/* STAGE */}
                            <div className="mx-auto w-full max-w-[1280px]">
                                {stageTiles.length <= 1 ? (
                                    <div className="aspect-video w-full">
                                        <MeetTile
                                            name={stageTiles[0]?.name ?? "—"}
                                            stream={stageTiles[0]?.stream ?? null}
                                            muted={stageTiles[0]?.muted ?? true}
                                            pinned={pinnedKeys.includes(stageTiles[0]?.key ?? "")}
                                            isActiveSpeaker={
                                                pinnedKeys.length === 0 &&
                                                !!activeSpeakerKey &&
                                                stageTiles[0]?.key === activeSpeakerKey
                                            }
                                            onTogglePin={() => stageTiles[0] && togglePin(stageTiles[0].key)}
                                        />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {stageTiles.map((t) => (
                                            <div key={t.key} className="aspect-video w-full">
                                                <MeetTile
                                                    name={t.name}
                                                    stream={t.stream}
                                                    muted={t.muted}
                                                    pinned={pinnedKeys.includes(t.key)}
                                                    isActiveSpeaker={pinnedKeys.length === 0 && t.key === activeSpeakerKey}
                                                    onTogglePin={() => togglePin(t.key)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* FILMSTRIP (hide if solo) */}
                            {!isSolo && filmstripTiles.length > 0 ? (
                                <div className="absolute bottom-6 left-6 right-6">
                                    <div className="flex gap-3 overflow-x-auto pb-2">
                                        {filmstripTiles.map((t) => (
                                            <div key={t.key} className="w-[280px] shrink-0">
                                                <div className="aspect-video w-full">
                                                    <MeetTile
                                                        name={t.name}
                                                        stream={t.stream}
                                                        muted={t.muted}
                                                        pinned={pinnedKeys.includes(t.key)}
                                                        isActiveSpeaker={pinnedKeys.length === 0 && t.key === activeSpeakerKey}
                                                        onTogglePin={() => togglePin(t.key)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* Footer controls */}
                    <div className="border-t border-slate-200 bg-white px-6 py-3">
                        <div className="flex items-center justify-center gap-2">
                            <IconToggleButton
                                pressed={!isMicOn}
                                onClick={onToggleMic}
                                iconOn={Mic}
                                iconOff={MicOff}
                                isOn={isMicOn}
                                label={isMicOn ? "Mute" : "Unmute"}
                            />

                            <IconToggleButton
                                pressed={!isCamOn}
                                onClick={onToggleCam}
                                iconOn={Video}
                                iconOff={VideoOff}
                                isOn={isCamOn}
                                label={isCamOn ? "Turn camera off" : "Turn camera on"}
                            />

                            {/* Share Screen */}
                            <IconToggleButton
                                pressed={isScreenSharing}
                                onClick={onToggleShareScreen ?? (() => { })}
                                iconOn={MonitorUp}
                                iconOff={MonitorOff}
                                isOn={!isScreenSharing}
                                label={isScreenSharing ? "Stop sharing" : "Share screen"}
                            />

                            <Button
                                intent="neutral"
                                size="md"
                                showText={false}
                                leftIcon={MessageSquare}
                                onClick={onOpenChat}
                                className="h-11 w-11 px-0 rounded-xl"
                                aria-label="Chat"
                                title="Chat"
                            />

                            <Button
                                intent="neutral"
                                size="md"
                                showText={false}
                                leftIcon={Users}
                                onClick={onOpenParticipants}
                                className="h-11 w-11 px-0 rounded-xl"
                                aria-label="Participants"
                                title="Participants"
                            />

                            <Button
                                intent="danger"
                                size="md"
                                showText={false}
                                leftIcon={LogOut}
                                onClick={onLeave}
                                className="h-11 w-11 px-0 rounded-xl"
                                aria-label="Leave"
                                title="Leave"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Small reusable icon toggle button.
 * - ON  => intent="primary"
 * - OFF => intent="danger"
 */
function IconToggleButton({
    isOn,
    pressed,
    onClick,
    iconOn,
    iconOff,
    label,
}: {
    isOn: boolean;
    pressed: boolean;
    onClick: () => void;
    iconOn: any;
    iconOff: any;
    label: string;
}) {
    const Icon = isOn ? iconOn : iconOff;

    return (
        <Button
            intent={isOn ? "primary" : "danger"}
            state={pressed ? "active" : "default"}
            size="md"
            showText={false}
            leftIcon={Icon}
            onClick={onClick}
            className="h-11 w-11 px-0 rounded-xl"
            aria-label={label}
            title={label}
        />
    );
}
