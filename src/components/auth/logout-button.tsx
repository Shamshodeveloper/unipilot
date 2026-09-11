"use client";

import { useActionState } from "react";
import { logout } from "@/app/(auth)/actions";
import type { AuthFormState } from "@/lib/validation/auth";

export function LogoutButton({ mobileIcon = false }: { mobileIcon?: boolean }) {
  const [state, action, pending] = useActionState<AuthFormState>(logout, {});
  return (
    <form action={action} aria-busy={pending} className={mobileIcon ? "relative sm:hidden" : undefined}>
      <button type="submit" disabled={pending} aria-label={mobileIcon ? (pending ? "Signing out…" : "Sign out") : undefined}
        className={mobileIcon ? "flex size-11 items-center justify-center rounded-full border border-ink/20 bg-white text-ink hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-60" : "button-secondary disabled:cursor-not-allowed disabled:opacity-60"}>
        {mobileIcon ? <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg> : pending ? "Signing out…" : "Logout"}
      </button>
      {state.error && <p role="alert" className={mobileIcon ? "absolute right-0 top-full z-10 mt-2 w-64 rounded-xl border border-red-200 bg-white p-3 text-sm text-red-800 shadow-sm" : "mt-2 max-w-sm text-sm text-red-800"}>{state.error}</p>}
    </form>
  );
}
