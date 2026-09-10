import type { Metadata } from "next";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { ensureProfile, requireUser } from "@/server/auth";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const profileReady = await ensureProfile();
  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-4xl font-semibold tracking-tight">Your study space</h1>
          <p className="mt-3 break-words text-base text-muted">You’re signed in{user.email ? <> as <span className="font-semibold text-ink">{user.email}</span></> : "."}</p>
        </div>
        <LogoutButton />
      </div>
      {!profileReady && <p role="alert" className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">You’re signed in, but we couldn’t initialize your profile. Refresh this page to retry.</p>}
      <section className="mt-10 flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-ink/25 bg-white px-6 py-12 text-center">
        <span aria-hidden="true" className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-2xl font-bold text-brand">U</span>
        <h2 className="text-2xl font-semibold tracking-tight">A fresh page for your studies</h2>
        <p className="mt-3 max-w-md text-base leading-7 text-muted">Your account is ready. Subjects and study tools will appear here as UniPilot grows.</p>
        <Link href="/" className="button-secondary mt-7">Back to home</Link>
      </section>
    </main>
  );
}
