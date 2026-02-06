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
} from "lucide-react";
import { Sidebar } from "../sidebar/sidebar";
import { SidebarNavItemData } from "../sidebar/sidebar-nav";
import { useEffect, useMemo, useRef } from "react";
import { SidebarUserData } from "../sidebar/sidebar-user";

type RemoteTrack = { producerId: string; stream: MediaStream };

type Props = {
    roomId: string;

    // el AppShell ya recibe title={meeting.title}, pero aquí lo usamos para el header
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
    const stage = remoteTracks[0] ?? null;
    const localVideoRef = useRef<HTMLVideoElement | null>(null);

    const hasLocalVideo = useMemo(() => {
        const t = localStream?.getVideoTracks?.() ?? [];
        return t.some((x) => x.readyState === "live" && x.enabled);
    }, [localStream]);

    useEffect(() => {
        const el = localVideoRef.current;
        if (!el) return;

        if (!localStream || !hasLocalVideo) {
            el.srcObject = null;
            return;
        }

        el.srcObject = localStream;

        void el.play().catch(() => { });
    }, [localStream, hasLocalVideo]);

    return (
        <div className="flex min-h-dvh">
            <Sidebar items={sidebarItems} user={sidebarUser} />

            <div className="h-[calc(100vh-0px)] w-full overflow-hidden">
                {/* Header (como la captura: back + título + subtítulo) */}
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
                        <div className="truncate text-xl font-semibold text-slate-900">
                            {meetingTitle}
                        </div>
                        <div className="truncate text-sm text-slate-500">
                            Información completa de la reunión
                        </div>
                    </div>
                </div>

                {/* Stage */}
                <div className="relative flex h-[calc(100%-76px)] flex-col bg-white">
                    <div className="relative flex-1 overflow-hidden">
                        {/* fondo oscuro */}
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

                        {/* contenido central */}
                        <div className="relative z-10 flex h-full items-center justify-center px-6">
                            {stage ? (
                                <video
                                    className="h-full max-h-[78vh] w-full max-w-[1180px] rounded-2xl bg-black/30 object-cover shadow-xl ring-1 ring-white/10"
                                    autoPlay
                                    playsInline
                                    ref={(el) => {
                                        if (!el) return;
                                        el.srcObject = stage.stream;
                                    }}
                                />
                            ) : (
                                <div className="flex w-full max-w-[980px] items-center justify-center rounded-2xl bg-white/5 p-10 text-center ring-1 ring-white/10">
                                    <div className="space-y-2">
                                        <div className="text-lg font-semibold text-white">
                                            Sala preparada
                                        </div>
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

                        {/* Local PiP (abajo derecha) */}
                        <div className="absolute bottom-20 right-6 z-20 w-[260px] overflow-hidden rounded-2xl bg-slate-950/40 shadow-2xl ring-1 ring-white/10">
                            <div className="px-3 pt-3 text-xs font-medium text-white/80">
                                Tú
                            </div>

                            <div className="relative p-3 pt-2">
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
                                            Sin vídeo
                                        </div>
                                    )}
                                </div>

                                <div className="absolute bottom-5 left-5 rounded-md bg-white/10 px-2 py-1 text-[11px] text-white/80 ring-1 ring-white/10">
                                    {hasLocalVideo ? "Cámara activada" : "Cámara desactivada"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer controls (centrados como la captura) */}
                    <div className="border-t border-slate-200 bg-white px-6 py-3">
                        <div className="flex items-center justify-center gap-2">
                            <IconToggleButton
                                pressed={!isMicOn} // si está OFF, se ve “danger”
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
 * Botón toggle reutilizando TU Button (variants), sin inventar estilos.
 * - ON => intent="primary" (verde)
 * - OFF => intent="danger" (rojo)
 * - icon-only
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
    iconOn: any; // LucideIcon
    iconOff: any; // LucideIcon
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
