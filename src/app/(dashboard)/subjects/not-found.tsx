import Link from "next/link";
export default function SubjectNotFound() {
  return <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-5 py-12"><h1 className="text-3xl font-semibold">Subject not found</h1><p className="mt-4 text-muted">This subject is unavailable or does not belong to your account.</p><Link href="/subjects" className="button-primary mt-6">Back to Subjects</Link></main>;
}
