import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Props for {@link Switch}.
 */
type SwitchProps = {
    /**
     * Current checked state (controlled component).
     */
    checked: boolean;

    /**
     * Called with the next checked value when the user toggles the switch.
     */
    onCheckedChange: (v: boolean) => void;

    /**
     * Disables interaction and dims the component.
     */
    disabled?: boolean;

    /**
     * Optional extra classes for the button wrapper.
     */
    className?: string;
};

/**
 * Simple controlled switch component.
 *
 * Notes:
 * - Uses a `<button>` for broad styling control.
 * - Sets `aria-pressed` to expose toggle state to assistive tech.
 *
 * If you need full ARIA switch semantics, you can switch to `role="switch"`
 * and use `aria-checked`, but this is a solid lightweight pattern.
 */
export function Switch({ checked, onCheckedChange, disabled, className }: SwitchProps) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                "relative h-7 w-12 rounded-full transition",
                checked ? "bg-emerald-400" : "bg-slate-300",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                className
            )}
            aria-pressed={checked}
        >
            <span
                className={cn(
                    "absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow transition",
                    checked ? "left-[26px]" : "left-[3px]"
                )}
            />
        </button>
    );
}