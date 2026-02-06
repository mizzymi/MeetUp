import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icons/icon";

/**
 * Props for {@link IconButton}.
 *
 * Extends native button props.
 */
type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    /**
     * Lucide icon component reference.
     */
    icon: LucideIcon;

    /**
     * Size preset for the button container.
     * @defaultValue "md"
     */
    size?: "sm" | "md" | "lg";

    /**
     * Visual style of the button.
     * - `ghost`: transparent with hover background
     * - `soft`: subtle background
     * - `solid`: strong background (icon inherits text color)
     * @defaultValue "ghost"
     */
    variant?: "ghost" | "soft" | "solid";

    /**
     * Semantic text/icon color (ignored for `variant="solid"` since it uses `text-white`).
     * @defaultValue "neutral"
     */
    tone?: "neutral" | "primary" | "danger";
};

const sizeCls = {
    sm: "h-9 w-9",
    md: "h-10 w-10",
    lg: "h-11 w-11",
};

const variantCls = {
    ghost: "bg-transparent hover:bg-slate-100",
    soft: "bg-slate-100 hover:bg-slate-200",
    solid: "bg-slate-900 text-white hover:bg-slate-800",
};

const toneCls = {
    neutral: "text-slate-800",
    primary: "text-emerald-700",
    danger: "text-red-700",
};

/**
 * Icon-only button.
 *
 * Accessibility tip:
 * - Prefer adding `aria-label="..."` when the icon does not have adjacent text.
 */
export function IconButton({
    icon,
    size = "md",
    variant = "ghost",
    tone = "neutral",
    className,
    ...props
}: IconButtonProps) {
    return (
        <button
            type="button"
            className={cn(
                "inline-flex items-center justify-center rounded-full transition outline-none",
                "focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2",
                "disabled:opacity-50 disabled:pointer-events-none",
                sizeCls[size],
                variantCls[variant],
                variant === "solid" ? "" : toneCls[tone],
                className
            )}
            {...props}
        >
            <Icon icon={icon} className={cn(variant === "solid" ? "text-inherit" : "")} />
        </button>
    );
}