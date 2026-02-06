
"use client";

import * as React from "react";

/**
 * Shape of the meeting form values handled by the modal.
 * Keep it serializable and easy to validate.
 */
export type NewMeetingValues = {
    title: string;
    startAt: string;
    endAt: string;
    guestEmail: string;
    notes: string;
    createVideoLink: boolean;
};

const DEFAULT_VALUES: NewMeetingValues = {
    title: "",
    startAt: "",
    endAt: "",
    guestEmail: "",
    notes: "",
    createVideoLink: true,
};

export type UseNewMeetingModalOptions = {
    /**
     * Optional defaults to prefill the form when opening.
     */
    defaultValues?: Partial<NewMeetingValues>;

    /**
     * Called when user confirms "Guardar evento".
     * If it returns a Promise, the modal can show a loading/disabled state.
     */
    onSave?: (values: NewMeetingValues) => void | Promise<void>;
};

export type UseNewMeetingModalReturn = {
    /**
     * Whether the modal is open.
     */
    open: boolean;

    /**
     * Open the modal.
     */
    onOpen: () => void;

    /**
     * Close the modal.
     */
    onClose: () => void;

    /**
     * Direct setter (useful if you bind to `onOpenChange` props).
     */
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;

    /**
     * Current form values (controlled by the hook).
     */
    values: NewMeetingValues;

    /**
     * Set a specific field.
     */
    setValue: <K extends keyof NewMeetingValues>(key: K, value: NewMeetingValues[K]) => void;

    /**
     * Replace the whole form (rare).
     */
    setValues: React.Dispatch<React.SetStateAction<NewMeetingValues>>;

    /**
     * Reset values to defaults (or provided defaultValues).
     */
    reset: () => void;

    /**
     * Save handler wrapper (calls `options.onSave`).
     */
    submit: () => Promise<void>;

    /**
     * True while submit is running.
     */
    saving: boolean;
};

/**
 * useNewMeetingModal
 *
 * A single source of truth for:
 * - modal open state
 * - form values
 * - submit lifecycle (saving)
 *
 * This keeps the UI component dumb/reusable.
 */
export function useNewMeetingModal(
    options: UseNewMeetingModalOptions = {}
): UseNewMeetingModalReturn {
    const { defaultValues, onSave } = options;

    const buildDefaults = React.useCallback((): NewMeetingValues => {
        return { ...DEFAULT_VALUES, ...(defaultValues ?? {}) };
    }, [defaultValues]);

    const [open, setOpen] = React.useState(false);
    const [values, setValues] = React.useState<NewMeetingValues>(buildDefaults);
    const [saving, setSaving] = React.useState(false);

    /**
     * Resets form values to defaults (including `options.defaultValues`).
     */
    const reset = React.useCallback(() => {
        setValues(buildDefaults());
    }, [buildDefaults]);

    /**
     * Open modal + reset form so each open starts fresh by default.
     */
    const onOpen = React.useCallback(() => {
        reset();
        setOpen(true);
    }, [reset]);

    /**
     * Close modal.
     */
    const onClose = React.useCallback(() => {
        setOpen(false);
    }, []);

    /**
     * Set a single field.
     */
    const setValue = React.useCallback(
        <K extends keyof NewMeetingValues>(key: K, value: NewMeetingValues[K]) => {
            setValues((prev) => ({ ...prev, [key]: value }));
        },
        []
    );

    /**
     * Submit wrapper.
     * - toggles `saving`
     * - calls user `onSave`
     * - closes on success
     */
    const submit = React.useCallback(async () => {
        try {
            setSaving(true);
            await onSave?.(values);
            setOpen(false);
        } finally {
            setSaving(false);
        }
    }, [onSave, values]);

    return {
        open,
        onOpen,
        onClose,
        setOpen,
        values,
        setValue,
        setValues,
        reset,
        submit,
        saving,
    };
}