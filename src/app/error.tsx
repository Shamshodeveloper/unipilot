"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main-content" className="flex flex-1 flex-col items-center justify-center gap-5 px-5 py-20 text-center">
      <h1 className="text-3xl font-semibold">Something went wrong</h1>
      <p className="text-muted">We couldn’t load this page. Please try again.</p>
      <button type="button" onClick={reset} className="button-primary">Try again</button>
    </main>
  );
}
