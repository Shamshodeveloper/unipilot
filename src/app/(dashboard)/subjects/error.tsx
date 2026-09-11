"use client";
export default function SubjectsError({ reset }: { reset: () => void }) {
  return <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-5 py-12"><h1 className="text-3xl font-semibold">We couldn’t load your subjects</h1><p className="mt-4 text-muted">Please try again in a moment.</p><button onClick={reset} className="button-primary mt-6">Try again</button></main>;
}
