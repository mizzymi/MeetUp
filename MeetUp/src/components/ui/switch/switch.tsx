import { cn } from "@/lib/cn";

/**
 * Props for {@link Switch}.
 */
export type SwitchProps = {
    /**
     * Current checked state (controlled component).
     */
    checked: boolean;

    /**
     * Called with the next checked value when the user toggles the switch.
     */
    onCheckedChange: (next: boolean) => void;

    /**
     * Disables interaction and dims the component.
     */
    disabled?: boolean;

    /**
     * Optional extra classes for the switch root element.
     */
    className?: string;

    /**
     * Optional accessible label. If you don't provide it, ensure the surrounding UI
     * provides an accessible name (e.g. a visible label or aria-labelledby).
     */
    "aria-label"?: string;

    /**
     * Optional id for label association.
     */
    id?: string;
};

/**
 * Switch (controlled)
 *
 * A lightweight, accessible, controlled switch component.
 *
 * ✅ Accessibility:
 * - Uses `role="switch"` + `aria-checked` (correct semantics for switches).
 * - Supports keyboard interaction (Space/Enter).
 *
 * ✅ Correctness:
 * - Prevents event bubbling issues that can happen when placed inside
 *   clickable cards/rows (common in settings UIs).
 *
 * ✅ Styling:
 * - Uses tailwind classes; keeps your existing look/feel.
 *
 * Important:
 * - This is a CONTROLLED component: `checked` must come from React state.
 * - `onCheckedChange` must update that state.
 */
export function Switch({
    checked,
    onCheckedChange,
    disabled = false,
    className,
    id,
    "aria-label": ariaLabel,
}: SwitchProps) {
    /**
     * Toggle helper (centralized so click + keyboard use the same logic).
     * Uses functional next state computed from `checked`.
     */
    const toggle = () => {
        if (disabled) return;
        onCheckedChange(!checked);
    };

    return (
        <button
            id={id}
            type="button"
            disabled={disabled}
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            /**
             * Some UIs wrap switches inside clickable rows/cards.
             * Stopping propagation avoids parent onClick from firing and causing
             * double toggles or unexpected state resets.
             */
            onClick={(e) => {
                e.stopPropagation();
                toggle();
            }}
            /**
             * Keyboard support: Space and Enter should toggle a switch.
             * (Browsers already "click" buttons on Enter, but Space behavior is inconsistent
             * across custom setups, so we handle it explicitly.)
             */
            onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    toggle();
                }
            }}
            className={cn(
                "relative inline-flex h-7 w-12 items-center rounded-full transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2",
                checked ? "bg-emerald-500" : "bg-slate-300",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                className
            )}
        >
            <span
                aria-hidden="true"
                className={cn(
                    "absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow transition-all",
                    checked ? "left-[26px]" : "left-[3px]"
                )}
            />
        </button>
    );
}
