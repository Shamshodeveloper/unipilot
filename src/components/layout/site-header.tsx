import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { getCurrentUser } from "@/server/auth";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-ink/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 sm:gap-4 sm:px-8">
        <Link href="/" aria-label="UniPilot home" className="flex items-center gap-2 text-lg font-bold tracking-tight sm:gap-2.5 sm:text-xl">
          <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-xl bg-brand text-lg text-white sm:size-9">U</span>
          UniPilot
        </Link>
        <nav aria-label="Main navigation" className="flex shrink-0 items-center gap-2 sm:gap-6">
          {user ? (
            <>
              <Link href="/dashboard" className="button-primary min-h-11 px-4 py-2 text-sm sm:min-h-10">Dashboard</Link>
              <LogoutButton mobileIcon />
            </>
          ) : (
            <>
              <Link href="/login" className="py-2 text-sm font-semibold hover:underline">Sign In</Link>
              <Link href="/register" className="button-primary min-h-10 px-4 py-2 text-sm">Get Started</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
