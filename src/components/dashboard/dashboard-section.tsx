import type { ReactNode } from "react";

export function DashboardSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section aria-label={title} className="min-w-0 rounded-3xl border border-ink/10 bg-white p-6 sm:p-8">
    <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
    <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
    <div className="mt-6">{children}</div>
  </section>;
}
export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="rounded-2xl border border-dashed border-ink/20 bg-paper p-6"><p className="font-semibold">{title}</p><p className="mt-2 text-sm leading-6 text-muted">{detail}</p></div>;
}
export function DataError({ section }: { section: string }) {
  return <p role="alert" className="rounded-2xl bg-amber-50 p-5 text-sm leading-6 text-amber-950">We couldn’t load {section}. <a href="/dashboard" className="font-semibold underline underline-offset-4">Refresh the dashboard</a> to try again.</p>;
}
