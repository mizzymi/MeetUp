import { cva } from "class-variance-authority";

/**
 * Tailwind class generator for the `Button` component.
 *
 * Built with `class-variance-authority (cva)` to keep variants consistent and type-friendly.
 *
 * Variants:
 * - `intent`: semantic purpose / color style (neutral, primary, info, secondary, danger)
 * - `state`: visual state styling (default, active, focus, selected)
 * - `size`: height + padding presets
 * - `fullWidth`: stretches the button to container width
 *
 * Usage:
 * ```ts
 * const cls = buttonStyles({ intent: "primary", size: "lg", fullWidth: true })
 * ```
 */
export const buttonStyles = cva(
    [
        "inline-flex items-center justify-center gap-2",
        "rounded-lg px-4 py-2 text-sm font-medium",
        "transition outline-none select-none",
        "focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
    ].join(" "),
    {
        variants: {
            /**
             * Semantic intent (tone) of the button.
             */
            intent: {
                neutral: "bg-slate-100 text-slate-900 hover:bg-slate-200",
                primary: "bg-emerald-400 text-slate-900 hover:bg-emerald-300",
                info: "bg-sky-400 text-slate-900 hover:bg-sky-300",
                secondary: "bg-purple-300 text-slate-900 hover:bg-purple-200",
                danger: "bg-red-200 text-slate-900 hover:bg-red-100",
            },

            /**
             * Optional extra state styles (e.g., when used as a toggle/tab).
             */
            state: {
                default: "",
                active: "ring-2 ring-slate-900/20",
                focus: "ring-2 ring-sky-400 ring-offset-2",
                selected: "ring-2 ring-emerald-400 ring-offset-2",
            },

            /**
             * Size presets.
             */
            size: {
                sm: "h-9 px-3",
                md: "h-10 px-4",
                lg: "h-11 px-5 text-base",
            },

            /**
             * Width behavior.
             */
            fullWidth: {
                true: "w-full",
                false: "",
            },
        },
        defaultVariants: {
            intent: "neutral",
            state: "default",
            size: "md",
            fullWidth: false,
        },
    }
);