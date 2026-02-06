import { useState, useCallback } from "react";

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
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [values, setValues] = useState<NewMeetingValues>(initialValues);
    const [editingId, setEditingId] = useState<number | null>(null);
    const setValue = useCallback(<K extends keyof NewMeetingValues>(key: K, value: NewMeetingValues[K]) => {
        setValues((prev) => ({ ...prev, [key]: value }));
    }, []);

    const openCreate = useCallback(() => {
        setEditingId(null);
        setValues(initialValues);
        setOpen(true);
    }, []);

    const openEdit = useCallback((id: number, preset: NewMeetingValues) => {
        setEditingId(id);
        setValues(preset);
        setOpen(true);
    }, []);

    const onClose = useCallback(() => {
        setOpen(false);
    }, []);

    const reset = useCallback(() => {
        setValues(initialValues);
    }, []);

    const submit = useCallback(async () => {
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
