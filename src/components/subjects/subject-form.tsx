"use client";
import Link from "next/link";
import { useActionState } from "react";
import { saveSubject } from "@/app/(dashboard)/subjects/actions";
import type { SubjectFormState } from "@/lib/validation/subjects";

type Subject = { id: string; name: string; description: string | null; instructor: string | null };
export function SubjectForm({ subject }: { subject?: Subject }) {
  const [state, action, pending] = useActionState<SubjectFormState, FormData>(saveSubject, {});
  return <form action={action} aria-label="Subject form" aria-busy={pending} noValidate className="mt-8 rounded-3xl border border-ink/10 bg-white p-6 sm:p-8">
    {subject && <input type="hidden" name="subjectId" value={subject.id} />}
    <fieldset disabled={pending} className="space-y-6">
      <legend className="sr-only">Subject information</legend>
      {([{ name: "name", label: "Name", max: 200 }, { name: "description", label: "Description (optional)", max: 5000 }, { name: "instructor", label: "Instructor (optional)", max: 200 }] as const).map((field) => {
        const errors = state.fieldErrors?.[field.name];
        const props = { id: field.name, name: field.name, maxLength: field.max, defaultValue: state.values?.[field.name] ?? subject?.[field.name] ?? "", required: field.name === "name", "aria-invalid": Boolean(errors?.length), "aria-describedby": errors?.length ? `${field.name}-error` : undefined, className: "w-full min-h-12 rounded-xl border border-ink/20 bg-paper px-4 py-3 disabled:opacity-60" };
        return <div key={field.name}><label htmlFor={field.name} className="mb-2 block text-sm font-semibold">{field.label}</label>{field.name === "description" ? <textarea {...props} rows={5} /> : <input {...props} type="text" />}{errors?.length && <p id={`${field.name}-error`} className="mt-2 text-sm text-red-800">{errors[0]}</p>}</div>;
      })}
      <div className="flex flex-wrap items-center gap-4"><button type="submit" className="button-primary disabled:opacity-60">{pending ? "Saving…" : subject ? "Save Changes" : "Create Subject"}</button><Link href={subject ? `/subjects/${subject.id}` : "/subjects"} className="button-secondary">Cancel</Link></div>
    </fieldset>
    <div aria-live="polite">{state.error && <p role="alert" className="mt-4 text-sm text-red-800">{state.error}</p>}{state.fieldErrors && <p className="mt-4 text-sm text-red-800">Please check the highlighted fields.</p>}</div>
  </form>;
}
