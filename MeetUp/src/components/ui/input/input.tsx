import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icons/icon";
import { inputStyles } from "./input.styles";
import { forwardRef } from "react";

/**
 * Props for {@link Input}.
 *
 * Extends native input props (value, onChange, placeholder, etc).
 */
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    /**
     * Visual validation state.
     * @defaultValue "default"
     */
    state?: "default" | "error";

    /**
     * Optional left icon (renders inside the input).
     */
    leftIcon?: LucideIcon;

    /**
     * Optional right icon (renders inside the input).
     */
    rightIcon?: LucideIcon;
};

/**
 * Text input with optional leading/trailing icons.
 *
 * Layout notes:
 * - Icons are absolutely positioned inside a relatively positioned wrapper.
 * - Padding is adjusted automatically via `inputStyles` variants.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ state = "default", leftIcon, rightIcon, className, ...props }, ref) => {
        const withLeftIcon = Boolean(leftIcon);
        const withRightIcon = Boolean(rightIcon);

        return (
            <div className="relative w-full">
                {leftIcon ? (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                        <Icon icon={leftIcon} />
                    </span>
                ) : null}

                <input
                    ref={ref}
                    className={cn(inputStyles({ state, withLeftIcon, withRightIcon }), className)}
                    {...props}
                />

                {rightIcon ? (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                        <Icon icon={rightIcon} />
                    </span>
                ) : null}
            </div>
        );
    }
);
Input.displayName = "Input";