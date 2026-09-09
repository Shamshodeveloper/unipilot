import Link from "next/link";

export function AuthPreview({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";

  return (
    <main id="main-content" className="flex flex-1 items-center justify-center px-5 py-12 sm:py-20">
      <section className="w-full max-w-md rounded-3xl border border-ink/10 bg-white p-6 shadow-sm sm:p-10" aria-labelledby="auth-title">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand">Your study space</p>
        <h1 id="auth-title" className="text-3xl font-semibold tracking-tight">{isLogin ? "Welcome back" : "Start with a little structure"}</h1>
        <p id="auth-notice" className="mt-4 text-base leading-7 text-muted">{isLogin ? "Sign in is coming soon." : "Account registration is coming soon."} This is a preview; no account details are collected.</p>
        <fieldset disabled aria-describedby="auth-notice" className="mt-7 space-y-5">
          <legend className="sr-only">{isLogin ? "Sign in preview" : "Registration preview"}</legend>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold">Email address</label>
            <input id="email" type="email" autoComplete="email" placeholder="you@university.edu" className="min-h-12 w-full rounded-xl border border-ink/15 bg-paper px-4 text-base disabled:cursor-not-allowed" />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold">Password</label>
            <input id="password" type="password" autoComplete={isLogin ? "current-password" : "new-password"} placeholder="Not available yet" className="min-h-12 w-full rounded-xl border border-ink/15 bg-paper px-4 text-base disabled:cursor-not-allowed" />
          </div>
          <button type="button" className="min-h-12 w-full rounded-full bg-ink/10 px-5 py-3 font-semibold text-muted disabled:cursor-not-allowed">{isLogin ? "Sign In" : "Create Account"} — coming soon</button>
        </fieldset>
        <p className="mt-7 text-center text-sm text-muted">
          {isLogin ? "New to UniPilot? " : "Already have an account? "}
          <Link href={isLogin ? "/register" : "/login"} className="font-semibold text-brand underline underline-offset-4">{isLogin ? "Get Started" : "Sign In"}</Link>
        </p>
        <Link href="/dashboard" className="mt-6 block text-center text-sm font-semibold text-brand underline underline-offset-4">Preview the dashboard</Link>
      </section>
    </main>
  );
}
