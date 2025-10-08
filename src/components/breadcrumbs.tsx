import { Link } from "react-router-dom";

type Crumb = { label: string, to?: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
    return (
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-600 dark:text-neutral-300">
            <ol className="flex flex-wrap items-center gap-1">
                {items.map((c, i) => {
                    const last = i === items.length - 1;
                    return (
                        <li key={i} className="flex items-center gap-1">
                            {c.to && !last ? (
                                <Link className="rounded-md px-1 hover:bg-black/10 dark:hover:bg-white/10" to={c.to}>
                                    {c.label}
                                </Link>
                            ) : (
                                <span className="px-1 opacity-80">{c.label}</span>
                            )}
                            {!last && <span className="opacity-40">/</span>}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}