import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="flex flex-1 flex-col items-center justify-center gap-5 px-5 py-20 text-center">
      <p className="text-sm font-semibold text-brand">404</p>
      <h1 className="text-3xl font-semibold">This page isn’t here</h1>
      <p className="text-muted">Return home to find your way.</p>
      <Link href="/" className="button-primary">Back to home</Link>
    </main>
  );
}
