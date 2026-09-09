import Link from "next/link";

export default function HomePage() {
  return (
    <main id="main-content" className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
      <section>
        <p className="mb-6 text-sm font-semibold uppercase tracking-[0.18em] text-brand">Your university. Your study system.</p>
        <h1 className="max-w-3xl text-5xl leading-[1.08] font-semibold tracking-[-0.045em] sm:text-6xl lg:text-7xl">Turn university materials into an <span className="text-brand">organized study system.</span></h1>
        <p className="mt-7 max-w-lg text-lg leading-8 text-muted">Make space for understanding. UniPilot is a home for a more focused university journey.</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/register" className="button-primary">Get Started <span aria-hidden="true" className="ml-4">↗</span></Link>
          <Link href="/login" className="button-secondary">Sign In</Link>
        </div>
      </section>
      <aside aria-label="UniPilot philosophy" className="relative overflow-hidden rounded-3xl bg-ink p-8 text-white sm:p-10 lg:py-14">
        <p className="text-sm uppercase tracking-[0.18em] text-lime-200">Room to think</p>
        <p className="mt-12 text-4xl leading-tight font-medium tracking-tight sm:text-5xl">Less scattered.<br /><span className="text-lime-200">More focused.</span></p>
        <div aria-hidden="true" className="my-10 flex h-20 items-end gap-3">
          <div className="h-6 flex-1 rounded-t-lg bg-white/15" />
          <div className="h-10 flex-1 rounded-t-lg bg-white/25" />
          <div className="h-14 flex-1 rounded-t-lg bg-white/45" />
          <div className="h-20 flex-1 rounded-t-lg bg-lime-200" />
        </div>
        <p className="border-t border-white/20 pt-6 text-base leading-7 text-white/80">A clearer way to approach what you learn, one step at a time.</p>
      </aside>
    </main>
  );
}
