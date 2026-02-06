import { cn } from "@/lib/cn";

/**
 * Props for {@link BgDetails}.
 */
type BgDetailsProps = {
  /**
   * Optional extra classes to customize positioning, z-index, opacity, etc.
   * The component already uses `absolute inset-0`, so usually you'll pass things like:
   * - `"z-0"` / `"z-[-1]"`
   * - `"opacity-80"`
   * - `"mix-blend-multiply"`
   */
  className?: string;
};

/**
 * Decorative background “blobs” used to add subtle color and depth behind a section/page.
 *
 * - Uses `pointer-events-none` so it never blocks clicks.
 * - Uses `absolute inset-0` so it fills the nearest `relative` parent.
 *   Make sure the container where you place it is `relative` (or otherwise positioned).
 * - The two blurred circles are placed outside the bounds (`-left/-top` and `-right/-bottom`)
 *   so only the soft gradient-like edges are visible.
 *
 * Typical usage:
 * ```tsx
 * <div className="relative overflow-hidden">
 *   <BgDetails className="z-0" />
 *   <div className="relative z-10">...</div>
 * </div>
 * ```
 */
export function BgDetails({ className }: BgDetailsProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)}>
      {/* Top-left purple glow */}
      <div className="absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full bg-purple-100/60 blur-3xl" />

      {/* Bottom-right emerald glow */}
      <div className="absolute -right-32 -bottom-32 h-[560px] w-[560px] rounded-full bg-emerald-100/70 blur-3xl" />
    </div>
  );
}
