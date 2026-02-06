"use client";

import * as React from "react";

export type NewMeetingValues = {
    title: string;
    startAt: string;
    endAt: string;
    guestEmail: string;
    notes: string;
    createVideoLink: boolean;
};

type UseNewMeetingModalArgs = {
    onSave: (values: NewMeetingValues, editingId: number | null) => void | Promise<void>;
};

const initialValues: NewMeetingValues = {
    title: "",
    startAt: "",
    endAt: "",
    guestEmail: "",
    notes: "",
    createVideoLink: true,
};

export function useNewMeetingModal({ onSave }: UseNewMeetingModalArgs) {
    const [open, setOpen] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [values, setValues] = React.useState<NewMeetingValues>(initialValues);
    const [editingId, setEditingId] = React.useState<number | null>(null);
    const setValue = React.useCallback(<K extends keyof NewMeetingValues>(key: K, value: NewMeetingValues[K]) => {
        setValues((prev) => ({ ...prev, [key]: value }));
    }, []);

    const openCreate = React.useCallback(() => {
        setEditingId(null);
        setValues(initialValues);
        setOpen(true);
    }, []);

    const openEdit = React.useCallback((id: number, preset: NewMeetingValues) => {
        setEditingId(id);
        setValues(preset);
        setOpen(true);
    }, []);

    const onClose = React.useCallback(() => {
        setOpen(false);
    }, []);

    const reset = React.useCallback(() => {
        setValues(initialValues);
    }, []);

    const submit = React.useCallback(async () => {
        if (saving) return;
        setSaving(true);
        try {
            await onSave(values, editingId);
            setOpen(false);
            setEditingId(null);
            setValues(initialValues);
        } finally {
            setSaving(false);
        }
    }, [onSave, values, editingId, saving]);

    return {
        open,
        setOpen,
        values,
        setValue,
        submit,
        saving,
        editingId,
        openCreate,
        openEdit
    };
}
