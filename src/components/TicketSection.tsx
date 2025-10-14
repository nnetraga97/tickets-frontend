import { ReactNode } from "react";

interface TicketSectionProps {
    title?: string;
    children: ReactNode;
    headerAction?: ReactNode;
}

export default function TicketSection({ title, children, headerAction }: TicketSectionProps) {
    return (
        <section className="rounded-2xl border border-black/5 bg-white p-4 dark:bg-neutral-900">
            {title && (
                <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    {headerAction}
                </div>
            )}
            {children}
        </section>
    );
}

