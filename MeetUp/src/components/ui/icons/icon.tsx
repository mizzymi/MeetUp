import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Props for {@link Icon}.
 */
type IconProps = {
    /**
     * Lucide icon component reference.
     */
    icon: LucideIcon;

    /**
     * Icon size in pixels.
     * @defaultValue 18
     */
    size?: number;

    /**
     * Optional extra classes.
     */
    className?: string;

    /**
     * SVG stroke width for Lucide icons.
     * @defaultValue 2
     */
    strokeWidth?: number;
};

/**
 * Small wrapper around Lucide icons to ensure consistent defaults
 * and reduce repetitive `size/strokeWidth/className` usage across the UI.
 */
export function Icon({ icon: Lucide, size = 18, strokeWidth = 2, className }: IconProps) {
    return <Lucide size={size} strokeWidth={strokeWidth} className={cn("shrink-0", className)} />;
}