export default function DashboardLoading() {
  return <main id="main-content" aria-busy="true" className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8 sm:py-16"><p role="status" className="text-lg font-semibold">Loading your study space…</p><div aria-hidden="true" className="mt-10 grid gap-6 sm:grid-cols-2">{[0, 1, 2, 3].map((item) => <div key={item} className="h-56 rounded-3xl border border-ink/10 bg-white motion-safe:animate-pulse" />)}</div></main>;
}
