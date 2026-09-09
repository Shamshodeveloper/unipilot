import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-semibold tracking-tight">Your study space</h1>
        <span className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-muted">Dashboard preview</span>
      </div>
      <section className="mt-10 flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-ink/25 bg-white px-6 py-12 text-center">
        <span aria-hidden="true" className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-2xl font-bold text-brand">U</span>
        <h2 className="text-2xl font-semibold tracking-tight">A fresh page for your studies</h2>
        <p className="mt-3 max-w-md text-base leading-7 text-muted">Your dashboard is coming soon. Subjects and study tools will appear here as UniPilot grows.</p>
        <Link href="/" className="button-secondary mt-7">Back to home</Link>
      </section>
    </main>
  );
}
