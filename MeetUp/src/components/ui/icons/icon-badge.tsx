import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

/**
 * Props for {@link IconBadge}.
 */
type IconBadgeProps = {
    /**
     * Lucide icon component reference.
     */
    icon: LucideIcon;

    /**
     * Icon size in pixels (passed to {@link Icon}).
     * @defaultValue 18
     */
    size?: number;

    /**
     * Visual style of the badge container.
     * - `none`: no background, only icon color
     * - `soft`: light background
     * - `solid`: strong background (icon inherits text color)
     * @defaultValue "soft"
     */
    variant?: "none" | "soft" | "solid";

    /**
     * Semantic tone that maps to text/background colors.
     * @defaultValue "neutral"
     */
    tone?: "logo" | "neutral" | "primary" | "info" | "secondary" | "danger";

    /**
     * Optional extra classes for the wrapper.
     */
    className?: string;
};

/**
 * Text color classes by tone.
 */
const toneClasses: Record<NonNullable<IconBadgeProps["tone"]>, string> = {
    logo: "text-white",
    neutral: "text-slate-700",
    primary: "text-emerald-700",
    info: "text-sky-700",
    secondary: "text-amber-800",
    danger: "text-red-700",
};

/**
 * Background classes by tone + variant.
 * Note: `variant="none"` intentionally applies no background.
 */
const bgClasses: Record<NonNullable<IconBadgeProps["tone"]>, { soft: string; solid: string }> = {
    logo: {
        soft: "bg-linear-65 from-purple-700 to-emerald-500 text-white",
        solid: "bg-linear-65 from purple-300 to-emerald-300 text-black",
    },
    neutral: { soft: "bg-slate-100", solid: "bg-slate-800 text-white" },
    primary: { soft: "bg-emerald-100", solid: "bg-emerald-500 text-slate-900" },
    info: { soft: "bg-sky-100", solid: "bg-sky-500 text-slate-900" },
    secondary: { soft: "bg-amber-100", solid: "bg-amber-400 text-slate-900" },
    danger: { soft: "bg-red-100", solid: "bg-red-400 text-slate-900" },
};

/**
 * Small icon badge/pill used for feature lists, headers, callouts, etc.
 *
 * - Uses a fixed square size (`h-9 w-9`) to keep layout stable.
 * - Uses `rounded-lg` to match your UI radius.
 */
export function IconBadge({
    icon,
    size = 18,
    variant = "soft",
    tone = "neutral",
    className,
}: IconBadgeProps) {
    const base = "inline-flex items-center justify-center rounded-lg";
    const padding = "h-9 w-9";
    const toneText = toneClasses[tone];

    const bg =
        variant === "none"
            ? ""
            : variant === "soft"
                ? bgClasses[tone].soft
                : bgClasses[tone].solid;

    return (
        <span className={cn(base, padding, variant === "none" ? "" : bg, toneText, className)}>
            <Icon icon={icon} size={size} className={variant === "solid" ? "text-inherit" : ""} />
        </span>
    );
}