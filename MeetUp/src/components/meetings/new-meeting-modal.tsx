"use client";

import * as React from "react";
import { CalendarDays, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Switch } from "@/components/ui/switch";
import type { NewMeetingValues } from "@/hooks/use-new-meeting-modal";

type NewMeetingModalProps = {
    /**
     * Controls modal visibility (controlled component).
     */
    open: boolean;

    /**
     * Called when the modal requests closing/opening (backdrop click, ESC, cancel).
     */
    onOpenChange: (open: boolean) => void;

    /**
     * Controlled form values (owned by the hook).
     */
    values: NewMeetingValues;

    /**
     * Set a specific field (owned by the hook).
     */
    setValue: <K extends keyof NewMeetingValues>(key: K, value: NewMeetingValues[K]) => void;

    /**
     * Called when user clicks "Guardar evento".
     */
    onSubmit: () => void | Promise<void>;

    /**
     * True while submitting (disables buttons).
     */
    saving?: boolean;

    /**
     * Optional custom class for panel container.
     */
    className?: string;

    /**
     * Optional title for the modal header.
     * @defaultValue "Nueva reunión"
     */
    title?: string;
};

/**
 * NewMeetingModal
 *
 * Presentational modal with:
 * - background blur
 * - centered panel
 * - fields similar to the screenshot
 *
 * It does NOT own state: it receives everything via props (from the hook).
 */
export function NewMeetingModal({
    open,
    onOpenChange,
    values,
    setValue,
    onSubmit,
    saving = false,
    className,
    title = "Nueva reunión",
}: NewMeetingModalProps) {
    React.useEffect(() => {
        if (!open) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onOpenChange(false);
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onOpenChange]);

    if (!open) return null;

    const onBackdropMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
    };

    return (
        <div
            className={cn("fixed inset-0 z-50 flex items-center justify-center p-4")}
            onMouseDown={onBackdropMouseDown}
        >
            {/* Backdrop (blur) */}
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" />

            {/* Panel */}
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
                <div className="mb-5">
                    <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                </div>

                <div className="space-y-5">
                    {/* Título */}
                    <div>
                        <label className="text-sm font-medium text-slate-900">
                            Título <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2">
                            <Input
                                placeholder="Placeholder"
                                value={values.title}
                                onChange={(e) => setValue("title", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium text-slate-900">
                                Fecha y hora de inicio <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <Input
                                    type="datetime-local"
                                    value={values.startAt}
                                    onChange={(e) => setValue("startAt", e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-900">
                                Fecha y hora de fin <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <Input
                                    type="datetime-local"
                                    value={values.endAt}
                                    onChange={(e) => setValue("endAt", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Invitado */}
                    <div>
                        <label className="text-sm font-medium text-slate-900">
                            Invitado (email) <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2">
                            <Input
                                type="email"
                                placeholder="Placeholder"
                                value={values.guestEmail}
                                onChange={(e) => setValue("guestEmail", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Notas */}
                    <div>
                        <label className="text-sm font-medium text-slate-900">Notas (opcional)</label>
                        <div className="mt-2">
                            <textarea
                                className={cn(
                                    "min-h-[150px] w-full rounded-lg border border-slate-200 bg-white px-3 py-3",
                                    "text-slate-900 placeholder:text-slate-400",
                                    "outline-none transition",
                                    "focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
                                )}
                                placeholder="Placeholder"
                                value={values.notes}
                                onChange={(e) => setValue("notes", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Switch callout */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900">
                                    Crear enlace de videollamada
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Se generará automáticamente un enlace para la reunión
                                </p>
                            </div>

                            <Switch
                                checked={values.createVideoLink}
                                onCheckedChange={(v) => setValue("createVideoLink", v)}
                            />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px w-full bg-slate-200" />

                    {/* Footer */}
                    <div className="flex items-center gap-3">
                        <Button
                            intent="primary"
                            leftIcon={Check}
                            onClick={onSubmit}
                            disabled={saving}
                        >
                            Guardar evento
                        </Button>

                        <Button
                            intent="secondary"
                            onClick={() => onOpenChange(false)}
                            disabled={saving}
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}