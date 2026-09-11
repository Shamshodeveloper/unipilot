import { getSubject } from "@/server/subjects";
import { SubjectForm } from "@/components/subjects/subject-form";
export const metadata = { title: "Edit Subject" };
export default async function EditSubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const subject = await getSubject((await params).id);
  return <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8"><h1 className="text-4xl font-semibold">Edit Subject</h1><SubjectForm subject={subject} /></main>;
}
