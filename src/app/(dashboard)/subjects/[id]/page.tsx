import Link from "next/link";
import { getSubject } from "@/server/subjects";
import { DeleteSubject } from "@/components/subjects/delete-subject";
import { DashboardSection, EmptyState } from "@/components/dashboard/dashboard-section";
export const metadata = { title: "Subject" };
export default async function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const subject = await getSubject((await params).id);
  return <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8">
    <Link href="/subjects" className="font-semibold text-brand hover:underline">← All subjects</Link>
    <div className="mt-6 flex flex-wrap items-start justify-between gap-5"><h1 className="min-w-0 break-words text-4xl font-semibold">{subject.name}</h1><Link href={`/subjects/${subject.id}/edit`} className="button-secondary">Edit Subject</Link></div>
    <p className="mt-5 whitespace-pre-wrap break-words leading-7 text-muted">{subject.description || "No description added."}</p><p className="mt-4 break-words text-sm text-muted">Instructor: {subject.instructor || "Not specified"}</p>
    <div className="mt-8 grid gap-6 sm:grid-cols-2">{["Topics", "Materials", "Exams", "Learning Progress"].map((title) => <DashboardSection key={title} title={title} description={`Your subject’s ${title.toLowerCase()}.`}><EmptyState title={`${title} is coming later.`} detail="This section is not available yet." /></DashboardSection>)}</div>
    <DeleteSubject id={subject.id} />
  </main>;
}
