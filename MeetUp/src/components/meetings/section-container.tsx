import { cn } from "@/lib/cn";

/**
 * Props for {@link SectionContainer}.
 */
type SectionContainerProps = {
    /**
     * Section title (e.g. "Próxima reunión").
     */
    title: string;

    /**
     * Optional right-side content (buttons, filters, links...).
     */
    right?: React.ReactNode;

    /**
     * Additional container classes.
     */
    className?: string;

    /**
     * Section content.
     */
    children: React.ReactNode;
};

/**
 * Simple section wrapper with a title row and content slot.
 *
 * Layout:
 * - Title row (left title, optional right content)
 * - Children below
 */
export function SectionContainer({ title, right, className, children }: SectionContainerProps) {
    return (
        <section className={cn("space-y-3", className)}>
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                {right}
            </div>

            {children}
        </section>
    );
}
