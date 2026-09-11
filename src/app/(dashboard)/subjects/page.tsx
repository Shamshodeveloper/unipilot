import Link from "next/link";
import { listSubjects } from "@/server/subjects";
import { EmptyState } from "@/components/dashboard/dashboard-section";
export const metadata = { title: "Subjects" };
export const dynamic = "force-dynamic";
export default async function SubjectsPage() {
  const subjects = await listSubjects();
  return <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-4xl font-semibold">Your subjects</h1><p className="mt-3 text-muted">Keep your university courses in one place.</p></div><Link href="/subjects/new" className="button-primary">Add Subject</Link></div>
    <div className="mt-8">{!subjects.length ? <EmptyState title="No subjects yet." detail="Add your first university subject to get started." /> : <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{subjects.map((subject) => <li key={subject.id} className="min-w-0 rounded-3xl border border-ink/10 bg-white p-6"><h2 className="break-words text-xl font-semibold"><Link href={`/subjects/${subject.id}`} className="underline-offset-4 hover:underline">{subject.name}</Link></h2><p className="mt-3 line-clamp-3 break-words text-sm leading-6 text-muted">{subject.description || "No description added."}</p><p className="mt-4 break-words text-sm text-muted">Instructor: {subject.instructor || "Not specified"}</p></li>)}</ul>}</div>
  </main>;
}
