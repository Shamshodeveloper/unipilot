"use client";

import { useActionState } from "react";
import { logout } from "@/app/(auth)/actions";
import type { AuthFormState } from "@/lib/validation/auth";

export function LogoutButton() {
  const [state, action, pending] = useActionState<AuthFormState>(logout, {});
  return (
    <form action={action} aria-busy={pending}>
      <button type="submit" disabled={pending} className="button-secondary disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Signing out…" : "Logout"}</button>
      {state.error && <p role="alert" className="mt-2 max-w-sm text-sm text-red-800">{state.error}</p>}
    </form>
  );
}
