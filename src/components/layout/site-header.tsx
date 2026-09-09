import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-ink/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link href="/" aria-label="UniPilot home" className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
          <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-xl bg-brand text-lg text-white">U</span>
          UniPilot
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-4 sm:gap-6">
          <Link href="/login" className="py-2 text-sm font-semibold hover:underline">Sign In</Link>
          <Link href="/register" className="button-primary min-h-10 px-4 py-2 text-sm">Get Started</Link>
        </nav>
      </div>
    </header>
  );
}
