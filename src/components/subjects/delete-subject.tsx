"use client";
import { useActionState } from "react";
import { deleteSubject } from "@/app/(dashboard)/subjects/actions";
import type { SubjectFormState } from "@/lib/validation/subjects";

export function DeleteSubject({ id }: { id: string }) {
  const [state, action, pending] = useActionState<SubjectFormState, FormData>(deleteSubject, {});
  return <section aria-label="Delete subject" className="mt-8 rounded-3xl border border-red-200 bg-white p-6 sm:p-8">
    <h2 className="text-xl font-semibold">Delete subject</h2>
    <p className="mt-3 text-sm leading-6 text-muted">This permanently deletes this subject and its related topics, materials metadata, exams, learning progress, and generated content. This cannot be undone.</p>
    <form action={action} aria-label="Delete subject form" aria-busy={pending} className="mt-5">
      <input type="hidden" name="subjectId" value={id} />
      <fieldset disabled={pending}><legend className="sr-only">Confirm deletion</legend>
        <label className="flex min-h-11 items-start gap-3 text-sm leading-6"><input type="checkbox" name="confirm" value="yes" required className="mt-1 size-5 shrink-0 accent-brand" />I understand and confirm that I want to delete this subject and its related data.</label>
        <button type="submit" className="mt-4 min-h-12 rounded-full bg-red-700 px-6 py-3 font-semibold text-white hover:bg-red-800 disabled:opacity-60">{pending ? "Deleting…" : "Delete Subject"}</button>
      </fieldset>
      {state.error && <p role="alert" className="mt-4 text-sm text-red-800">{state.error}</p>}
    </form>
  </section>;
}
