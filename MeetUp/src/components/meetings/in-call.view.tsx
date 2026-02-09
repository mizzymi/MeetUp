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
} from "lucide-react";
import { Sidebar } from "../sidebar/sidebar";
import { SidebarNavItemData } from "../sidebar/sidebar-nav";
import { useEffect, useMemo, useRef } from "react";
import { SidebarUserData } from "../sidebar/sidebar-user";

/**
 * NOTE:
 * remoteTracks in your hook includes kind ("audio" | "video"), but this UI type doesn’t.
 * If you pick remoteTracks[0] blindly, you can accidentally pick an AUDIO-only stream and render it as video (black).
 * So we pick the first remote stream that actually has a live video track.
 */
type RemoteTrack = { producerId: string; stream: MediaStream };

type Props = {
    roomId: string;
    meetingTitle: string;

    localStream: MediaStream | null;
    remoteTracks: RemoteTrack[];

    sidebarItems: SidebarNavItemData[];
    sidebarUser: SidebarUserData;

    isMicOn: boolean;
    isCamOn: boolean;

    onBack?: () => void;
    onToggleMic: () => void;
    onToggleCam: () => void;
    onOpenChat?: () => void;
    onOpenParticipants?: () => void;
    onLeave: () => void;
};

/**
 * Safe helper to attach/detach MediaStreams to <video>.
 * - Clears srcObject when stream becomes null.
 * - Calls play() (some browsers require it even with autoPlay).
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

export function InCallView({
    roomId,
    meetingTitle,
    localStream,
    remoteTracks,
    sidebarItems,
    sidebarUser,
    isMicOn,
    isCamOn,
    onBack,
    onToggleMic,
    onToggleCam,
    onOpenChat,
    onOpenParticipants,
    onLeave,
}: Props) {
    /**
     * Stage stream selection:
     * pick the first remote stream that has a LIVE video track.
     */
    const stage = useMemo(() => {
        for (const t of remoteTracks) {
            const vids = t.stream?.getVideoTracks?.() ?? [];
            const hasLiveVideo = vids.some((x) => x.readyState === "live" && x.enabled);
            if (hasLiveVideo) return t;
        }
        return null;
    }, [remoteTracks]);

    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const stageVideoRef = useRef<HTMLVideoElement | null>(null);

    const hasLocalVideo = useMemo(() => {
        const vids = localStream?.getVideoTracks?.() ?? [];
        return vids.some((x) => x.readyState === "live" && x.enabled);
    }, [localStream]);

    // Attach stage stream to stage <video>
    useEffect(() => {
        attachVideo(stageVideoRef.current, stage?.stream ?? null);
    }, [stage]);

    // Attach local stream to PiP <video> only if we really have a live video track
    useEffect(() => {
        attachVideo(localVideoRef.current, hasLocalVideo ? localStream : null);
    }, [localStream, hasLocalVideo]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            attachVideo(stageVideoRef.current, null);
            attachVideo(localVideoRef.current, null);
        };
    }, []);

    return (
        <div className="flex min-h-dvh">
            <Sidebar items={sidebarItems} user={sidebarUser} />

            <div className="h-[calc(100vh-0px)] w-full overflow-hidden">
                <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-4">
                    <Button
                        intent="neutral"
                        size="sm"
                        showText={false}
                        leftIcon={ArrowLeft}
                        onClick={onBack}
                        className="h-9 w-9 px-0"
                        aria-label="Volver"
                        title="Volver"
                    />

                    <div className="min-w-0">
                        <div className="truncate text-xl font-semibold text-slate-900">{meetingTitle}</div>
                        <div className="truncate text-sm text-slate-500">Información completa de la reunión</div>
                    </div>
                </div>

                <div className="relative flex h-[calc(100%-76px)] flex-col bg-white">
                    <div className="relative flex-1 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

                        <div className="relative z-10 flex h-full items-center justify-center px-6">
                            {stage ? (
                                <video
                                    className="h-full max-h-[78vh] w-full max-w-[1180px] rounded-2xl bg-black/30 object-cover shadow-xl ring-1 ring-white/10"
                                    autoPlay
                                    playsInline
                                    ref={stageVideoRef}
                                />
                            ) : (
                                <div className="flex w-full max-w-[980px] items-center justify-center rounded-2xl bg-white/5 p-10 text-center ring-1 ring-white/10">
                                    <div className="space-y-2">
                                        <div className="text-lg font-semibold text-white">Sala preparada</div>
                                        <div className="text-sm text-white/70">
                                            Cuando haya participantes, su vídeo aparecerá aquí.
                                        </div>
                                        <div className="pt-3 text-xs text-white/60">
                                            Sala: <span className="font-mono">{roomId}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="absolute bottom-20 right-6 z-20 w-[260px] overflow-hidden rounded-2xl bg-slate-950/40 shadow-2xl ring-1 ring-white/10">
                            <div className="relative p-3 pt-2">
                                {!isMicOn ? (
                                    <div className="absolute left-4 top-4 z-30 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/90 ring-1 ring-red-200/30 shadow">
                                        <MicOff className="h-4 w-4 text-white" />
                                    </div>
                                ) : null}

                                <div className="aspect-video overflow-hidden rounded-xl bg-black">
                                    {hasLocalVideo ? (
                                        <video
                                            ref={localVideoRef}
                                            className="h-full w-full object-cover"
                                            autoPlay
                                            playsInline
                                            muted
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs text-white/70">
                                            <CameraOff className="h-6 w-6" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 bg-white px-6 py-3">
                        <div className="flex items-center justify-center gap-2">
                            <IconToggleButton
                                pressed={!isMicOn}
                                onClick={onToggleMic}
                                iconOn={Mic}
                                iconOff={MicOff}
                                isOn={isMicOn}
                                label={isMicOn ? "Silenciar" : "Activar micro"}
                            />

                            <IconToggleButton
                                pressed={!isCamOn}
                                onClick={onToggleCam}
                                iconOn={Video}
                                iconOff={VideoOff}
                                isOn={isCamOn}
                                label={isCamOn ? "Apagar cámara" : "Encender cámara"}
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
                                aria-label="Participantes"
                                title="Participantes"
                            />

                            <Button
                                intent="danger"
                                size="md"
                                showText={false}
                                leftIcon={LogOut}
                                onClick={onLeave}
                                className="h-11 w-11 px-0 rounded-xl"
                                aria-label="Salir"
                                title="Salir"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Small helper toggle button.
 * - ON => intent="primary"
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