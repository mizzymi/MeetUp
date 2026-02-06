"use client";

import { CalendarDays, Clock, Copy, Pencil, Trash2, User, Video } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";

import { Api } from "@/lib/api";
import type { MeDto, MeetingDto, MeetingParticipantDto } from "@/lib/api/types";
import { formatTime } from "@/lib/time/format";
import { useEffect, useMemo, useState, type MouseEventHandler } from "react";
import { openMeetingEdit } from "@/hooks/open-meeting-edit";

/**
 * MeetingDetailsModalProps
 * ------------------------
 * Modal that displays the details of a meeting.
 *
 * Behavior:
 * - When `open` is true and `meetingId` is not null, it fetches the meeting via `Api.meeting(meetingId)`.
 * - ESC or clicking the backdrop closes the modal.
 *
 * Permissions:
 * - A meeting can be deleted only if the current user is:
 *   - the owner, or
 *   - a participant with role "PRIMARY_GUEST"
 *
 * Notes:
 * - UI hides the delete action when not allowed, but backend must enforce this too (403).
 */
export type MeetingDetailsModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    meetingId: number | null;
    me: MeDto | null;
    onDeleted?: () => void;
    title?: string;
    className?: string;
};

function isOwner(me: MeDto | null, meeting: MeetingDto | null): boolean {
    return !!me && !!meeting && me.id === meeting.ownerUserId;
}

function isPrimaryGuest(me: MeDto | null, meeting: MeetingDto | null): boolean {
    if (!me || !meeting) return false;
    return meeting.participants?.some(
        (p: MeetingParticipantDto) => p.role === "PRIMARY_GUEST" && p.userId === me.id
    );
}

export function MeetingDetailsModal({
    open,
    onOpenChange,
    meetingId,
    me,
    onDeleted,
    title = "Detalles de reunión",
    className,
}: MeetingDetailsModalProps) {
    const [loading, setLoading] = useState<boolean>(false);
    const [meeting, setMeeting] = useState<MeetingDto | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [copyOk, setCopyOk] = useState<boolean>(false);
    const [deleting, setDeleting] = useState<boolean>(false);

    /**
     * Close with Escape.
     */
    useEffect(() => {
        if (!open) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onOpenChange(false);
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onOpenChange]);

    /**
     * Load meeting when opened.
     */
    useEffect(() => {
        if (!open) return;

        setError(null);

        if (meetingId == null) {
            setMeeting(null);
            return;
        }

        let alive = true;
        setLoading(true);

        (async () => {
            try {
                const res = await Api.meeting(meetingId);
                if (!alive) return;
                setMeeting(res);
            } catch (e) {
                console.error("[MeetingDetailsModal] load failed:", e);
                if (!alive) return;
                setMeeting(null);
                setError("No se pudo cargar la reunión.");
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [open, meetingId]);

    /**
     * Derived presentation labels.
     */
    const dateLabel = useMemo(() => {
        if (!meeting) return "";
        const d = new Date(meeting.startsAt);
        return new Intl.DateTimeFormat("es-ES", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
        }).format(d);
    }, [meeting]);

    const timeLabel = useMemo(() => {
        if (!meeting) return "";
        return `${formatTime(meeting.startsAt)} - ${formatTime(meeting.endsAt)}`;
    }, [meeting]);

    const canDelete = useMemo(() => {
        return isOwner(me, meeting) || isPrimaryGuest(me, meeting);
    }, [me, meeting]);

    const deleteHelpText = useMemo(() => {
        if (!meeting) return "";
        return "No puedes borrar esta reunión (solo creador o invitado principal).";
    }, [meeting]);

    const roomUrl = meeting?.roomUrl ?? "";
    const guestName = meeting?.guestName ?? meeting?.guestEmail ?? "Invitado";
    const guestEmail = meeting?.guestEmail ?? "";
    const notes = meeting?.notes ?? "";

    const onBackdropMouseDown: MouseEventHandler<HTMLDivElement> = (e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
    };

    async function handleCopy(): Promise<void> {
        if (!roomUrl) return;
        await navigator.clipboard.writeText(roomUrl);
        setCopyOk(true);
        window.setTimeout(() => setCopyOk(false), 900);
    }

    async function handleDelete(): Promise<void> {
        if (meetingId == null) return;
        if (!canDelete) return;

        const ok = window.confirm("¿Seguro que quieres borrar esta reunión?");
        if (!ok) return;

        setDeleting(true);
        try {
            await Api.deleteMeeting(meetingId);
            onDeleted?.();
            onOpenChange(false);
        } finally {
            setDeleting(false);
        }
    }

    // ✅ Early return must be AFTER hooks
    if (!open) return null;

    return (
        <div
            className={cn("fixed inset-0 z-50 flex items-center justify-center p-4")}
            onMouseDown={onBackdropMouseDown}
        >
            {/* Same backdrop as NewMeetingModal */}
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" />

            <div
                role="dialog"
                aria-modal="true"
                className={cn(
                    "relative w-full max-w-[760px]",
                    "rounded-2xl border border-slate-200 bg-white shadow-xl",
                    "p-6",
                    className
                )}
            >
                {/* Header */}
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="text-base font-semibold text-slate-900">
                            {loading ? "Cargando…" : meeting?.title ?? title}
                        </h2>

                        {meeting ? (
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                                <span className="inline-flex items-center gap-2">
                                    <span aria-hidden><CalendarDays /></span>
                                    <span className="capitalize">{dateLabel}</span>
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <span aria-hidden><Clock /></span>
                                    <span>{timeLabel}</span>
                                </span>
                            </div>
                        ) : null}
                    </div>

                    <Button intent="secondary" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                </div>

                {/* Content */}
                <div className="space-y-5">
                    {loading ? (
                        <div className="text-sm text-slate-500">Cargando detalles…</div>
                    ) : meeting ? (
                        <>
                            {/* Guest */}
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Invitado
                                </div>
                                <div className="mt-3 flex items-center gap-3">
                                    <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 overflow-hidden">
                                        {meeting.guestAvatarUrl ? (
                                            <img
                                                src={meeting.guestAvatarUrl}
                                                alt={guestName}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <User />
                                        )}
                                    </div>

                                    <div className="leading-tight">
                                        <div className="text-sm font-semibold text-slate-900">{guestName}</div>
                                        <div className="text-xs text-slate-500">{guestEmail}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Room link */}
                            {(meeting.createVideoLink || !!roomUrl) && (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-sm font-semibold text-slate-900">Enlace de la sala</div>

                                    <div className="mt-3 flex gap-3">
                                        <Input value={roomUrl || "—"} readOnly />
                                        <Button
                                            intent="secondary"
                                            onClick={handleCopy}
                                            disabled={!roomUrl}
                                            leftIcon={Copy}
                                        >
                                            {copyOk ? "Copiado" : "Copiar"}
                                        </Button>
                                    </div>

                                    {!roomUrl ? (
                                        <p className="mt-2 text-xs text-slate-500">No hay enlace disponible todavía.</p>
                                    ) : null}
                                </div>
                            )}

                            {/* Notes */}
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Notas
                                </div>
                                <textarea
                                    readOnly
                                    className={cn(
                                        "mt-2 min-h-[150px] w-full rounded-lg border border-slate-200 bg-white px-3 py-3",
                                        "text-slate-900 placeholder:text-slate-400",
                                        "outline-none transition",
                                        "focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
                                    )}
                                    value={notes}
                                    placeholder="Sin notas."
                                />
                            </div>

                            <div className="h-px w-full bg-slate-200" />

                            {/* Actions */}
                            <div className="flex flex-wrap items-center gap-3">
                                <Button
                                    intent="primary"
                                    leftIcon={Video}
                                    onClick={() => roomUrl && window.open(roomUrl, "_blank", "noopener,noreferrer")}
                                    disabled={!roomUrl}
                                >
                                    Entrar
                                </Button>

                                <Button
                                    intent="secondary"
                                    leftIcon={Pencil}
                                    onClick={() => {
                                        if (!meeting) return;
                                        onOpenChange(false);
                                        openMeetingEdit(meeting);
                                    }}
                                >
                                    Editar
                                </Button>


                                {canDelete ? (
                                    <Button
                                        intent="danger"
                                        leftIcon={Trash2}
                                        onClick={handleDelete}
                                        disabled={deleting}
                                    >
                                        {deleting ? "Borrando…" : "Borrar"}
                                    </Button>
                                ) : (
                                    <div className="text-xs text-slate-500">{deleteHelpText}</div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-sm text-slate-500">{error ?? "No se pudo cargar la reunión."}</div>
                    )}
                </div>
            </div>
        </div>
    );
}
