import { requireUser } from "@/server/auth";
import { SubjectForm } from "@/components/subjects/subject-form";
export const metadata = { title: "Add Subject" };
export default async function NewSubjectPage() {
  await requireUser();
  return <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8"><h1 className="text-4xl font-semibold">Add Subject</h1><SubjectForm /></main>;
}
