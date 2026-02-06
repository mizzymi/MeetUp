import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icons/icon";
import { buttonStyles } from "./button.styles";

/**
 * Props for {@link Button}.
 *
 * Extends native button props so you can pass `onClick`, `type`, `disabled`, etc.
 */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    /**
     * Visual intent / tone.
     * @defaultValue "neutral"
     */
    intent?: "neutral" | "primary" | "info" | "secondary" | "danger";

    /**
     * Extra visual state (useful for toggle buttons, tabs, filters...).
     * @defaultValue "default"
     */
    state?: "default" | "active" | "focus" | "selected";

    /**
     * Size preset.
     * @defaultValue "md"
     */
    size?: "sm" | "md" | "lg";

    /**
     * If true, button takes full width of its container.
     * @defaultValue false
     */
    fullWidth?: boolean;

    /**
     * If false, hides the children text (useful for icon-only buttons).
     * @defaultValue true
     */
    showText?: boolean;

    /**
     * Optional left icon.
     */
    leftIcon?: LucideIcon;

    /**
     * Optional right icon.
     */
    rightIcon?: LucideIcon;

    /**
     * Control whether left icon is rendered (even if provided).
     * @defaultValue true
     */
    showLeftIcon?: boolean;

    /**
     * Control whether right icon is rendered (even if provided).
     * @defaultValue true
     */
    showRightIcon?: boolean;

    /**
     * Optional "swap" icon (e.g., from Figma variants).
     * If `swapped` is true, `leftIconSwap` will be used (fallback to `leftIcon`).
     */
    leftIconSwap?: LucideIcon;

    /**
     * Optional "swap" icon (e.g., from Figma variants).
     * If `swapped` is true, `rightIconSwap` will be used (fallback to `rightIcon`).
     */
    rightIconSwap?: LucideIcon;

    /**
     * When enabled, uses swap icons if provided.
     * @defaultValue false
     */
    swapped?: boolean;
};

/**
 * General purpose Button component with:
 * - `cva` variants (intent/state/size/fullWidth)
 * - optional left/right icons
 * - optional icon swapping (useful when translating design variants to code)
 */
export function Button({
    intent,
    state,
    size,
    fullWidth,

    showText = true,
    leftIcon,
    rightIcon,
    showLeftIcon = true,
    showRightIcon = true,

    leftIconSwap,
    rightIconSwap,
    swapped = false,

    className,
    children,
    ...props
}: ButtonProps) {
    const Left = swapped ? leftIconSwap ?? leftIcon : leftIcon;
    const Right = swapped ? rightIconSwap ?? rightIcon : rightIcon;

    return (
        <button
            className={cn(buttonStyles({ intent, state, size, fullWidth }), className)}
            {...props}
        >
            {showLeftIcon && Left ? <Icon icon={Left} /> : null}
            {showText ? <span className="truncate">{children}</span> : null}
            {showRightIcon && Right ? <Icon icon={Right} /> : null}
        </button>
    );
}