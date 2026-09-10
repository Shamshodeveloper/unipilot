"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register } from "@/app/(auth)/actions";
import type { AuthFormState } from "@/lib/validation/auth";

export function AuthForm({ mode, configured, confirmationFailed = false, localLogout = false }: {
  mode: "login" | "register";
  configured: boolean;
  confirmationFailed?: boolean;
  localLogout?: boolean;
}) {
  const isLogin = mode === "login";
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(isLogin ? login : register, {});
  const fields = [
    { name: "email", label: "Email address", type: "email", autoComplete: "email", placeholder: "you@university.edu" },
    { name: "password", label: "Password", type: "password", autoComplete: isLogin ? "current-password" : "new-password", placeholder: isLogin ? "Your password" : "At least 8 characters" },
    ...(!isLogin ? [{ name: "confirmPassword", label: "Confirm password", type: "password", autoComplete: "new-password", placeholder: "Repeat your password" }] : []),
  ] as const;

  return (
    <section className="w-full max-w-md rounded-3xl border border-ink/10 bg-white p-6 shadow-sm sm:p-10" aria-labelledby="auth-title">
      <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand">Your study space</p>
      <h1 id="auth-title" className="text-3xl font-semibold tracking-tight">{isLogin ? "Welcome back" : "Start with a little structure"}</h1>
      <p className="mt-4 text-base leading-7 text-muted">{isLogin ? "Sign in to your UniPilot study space." : "Create your account to begin your university journey."}</p>
      {!configured && <p role="alert" className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">Authentication is not configured yet. Please try again once setup is complete.</p>}
      {localLogout && <p role="status" className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">You’re signed out of this browser, but we couldn’t confirm sign-out with the server.</p>}
      {confirmationFailed && <p role="alert" className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">We couldn’t open that confirmation link. It may have expired or been opened in another browser. If your email is confirmed, sign in below; otherwise register again to request a new link.</p>}
      <form action={formAction} className="mt-7" noValidate aria-busy={pending}>
        <fieldset disabled={pending || !configured} className="space-y-5">
          <legend className="sr-only">{isLogin ? "Sign in" : "Create account"}</legend>
          {fields.map((field) => {
            const errors = state.fieldErrors?.[field.name as keyof NonNullable<AuthFormState["fieldErrors"]>];
            return (
              <div key={field.name}>
                <label htmlFor={field.name} className="mb-2 block text-sm font-semibold">{field.label}</label>
                <input id={field.name} name={field.name} type={field.type} autoComplete={field.autoComplete}
                  placeholder={field.placeholder} required maxLength={field.type === "email" ? 254 : 128}
                  aria-invalid={Boolean(errors?.length)} aria-describedby={errors?.length ? `${field.name}-error` : undefined}
                  className="min-h-12 w-full rounded-xl border border-ink/20 bg-paper px-4 text-base disabled:cursor-not-allowed disabled:opacity-60" />
                {errors?.length ? <p id={`${field.name}-error`} className="mt-2 text-sm text-red-800">{errors[0]}</p> : null}
              </div>
            );
          })}
          <button type="submit" className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-60">{pending ? (isLogin ? "Signing in…" : "Creating account…") : (isLogin ? "Sign In" : "Create Account")}</button>
        </fieldset>
        <div aria-live="polite" aria-atomic="true">
          {state.fieldErrors && <p className="mt-4 text-sm text-red-800">Please check the highlighted fields.</p>}
          {state.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">{state.error}</p>}
          {state.message && <p role="status" className="mt-4 rounded-xl bg-brand/10 p-4 text-sm leading-6 text-brand">{state.message}</p>}
        </div>
      </form>
      <p className="mt-7 text-center text-sm text-muted">
        {isLogin ? "New to UniPilot? " : "Already have an account? "}
        <Link href={isLogin ? "/register" : "/login"} className="font-semibold text-brand underline underline-offset-4">{isLogin ? "Register" : "Sign In"}</Link>
      </p>
    </section>
  );
}
