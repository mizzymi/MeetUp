import { cva } from "class-variance-authority";

/**
 * Tailwind class generator for {@link Input}.
 *
 * Variants:
 * - `state`: default vs error styling
 * - `withLeftIcon` / `withRightIcon`: adjusts padding to make room for icons
 */
export const inputStyles = cva(
    [
        "h-10 w-full rounded-lg px-3",
        "bg-white text-slate-900 placeholder:text-slate-400",
        "border transition outline-none",
        "focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed",
    ].join(" "),
    {
        variants: {
            /**
             * Validation/visual state.
             */
            state: {
                default: "border-slate-200 focus-visible:ring-sky-400",
                error: "border-red-300 focus-visible:ring-red-300",
            },

            /**
             * If true, adds left padding to fit an icon.
             */
            withLeftIcon: {
                true: "pl-10",
                false: "",
            },

            /**
             * If true, adds right padding to fit an icon.
             */
            withRightIcon: {
                true: "pr-10",
                false: "",
            },
        },
        defaultVariants: {
            state: "default",
            withLeftIcon: false,
            withRightIcon: false,
        },
    }
);