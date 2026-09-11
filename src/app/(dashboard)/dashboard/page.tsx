import type { Metadata } from "next";
import { LogoutButton } from "@/components/auth/logout-button";
import { DashboardSection, DataError, EmptyState } from "@/components/dashboard/dashboard-section";
import { ensureProfile, requireUser } from "@/server/auth";
import { loadDashboard } from "@/server/dashboard";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";
const dateFormat = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const statuses = [
  { key: "not_started", label: "Not started", color: "bg-ink/40" },
  { key: "learning", label: "Learning", color: "bg-blue-600" },
  { key: "needs_review", label: "Needs review", color: "bg-amber-600" },
  { key: "mastered", label: "Mastered", color: "bg-brand" },
] as const;

export default async function DashboardPage() {
  const user = await requireUser();
  const [profileReady, { subjects, exams, materials, progress }] = await Promise.all([ensureProfile(), loadDashboard()]);
  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand">Your study space</p>
          <h1 className="text-4xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-3 break-words text-base text-muted">You’re signed in{user.email ? <> as <span className="font-semibold text-ink">{user.email}</span></> : "."}</p>
        </div>
        <div className="hidden sm:block"><LogoutButton /></div>
      </div>
      {!profileReady && <p role="alert" className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">You’re signed in, but we couldn’t initialize your profile. Refresh this page to retry.</p>}
      <div className="mt-10 grid gap-6">
        <DashboardSection title="Today’s Study" description="A little progress, one topic at a time.">
          <EmptyState title="No study plan for today yet." detail="Your subjects, exams, and learning progress are collected below. Daily study planning is coming later." />
        </DashboardSection>
        <DashboardSection title="Subjects Overview" description="Your university subjects, most recently added first.">
          {subjects.error ? <DataError section="your subjects" /> : !subjects.data?.length ? <EmptyState title="No subjects yet." detail="Add your first university subject to get started." /> : <>
            <p className="mb-4 text-sm text-muted">Showing {subjects.data.length} of {subjects.count ?? subjects.data.length} subjects.</p>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{subjects.data.map((subject) => <li key={subject.id} className="min-w-0 rounded-2xl border border-ink/10 bg-paper p-5"><h3 className="break-words text-lg font-semibold">{subject.name}</h3><p className="mt-2 line-clamp-3 break-words text-sm leading-6 text-muted">{subject.description || "No description added."}</p></li>)}</ul>
          </>}
        </DashboardSection>
        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardSection title="Upcoming Exams" description="Your next five exams, including today (UTC).">
            {exams.error ? <DataError section="upcoming exams" /> : !exams.data?.length ? <EmptyState title="No upcoming exams." detail="Your scheduled exams will appear here as their dates approach." /> : <ul className="divide-y divide-ink/10">{exams.data.map((exam) => <li key={exam.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"><h3 className="min-w-0 break-words font-semibold">{exam.title}</h3><time dateTime={exam.exam_date} className="shrink-0 rounded-full bg-brand/10 px-3 py-2 text-sm font-medium text-brand">{dateFormat.format(new Date(`${exam.exam_date}T00:00:00Z`))}</time></li>)}</ul>}
          </DashboardSection>
          <DashboardSection title="Recent Materials" description="Your five most recently added materials.">
            {materials.error ? <DataError section="recent materials" /> : !materials.data?.length ? <EmptyState title="No materials yet." detail="Lecture slides, notes, and other study materials will appear here when available." /> : <ul className="divide-y divide-ink/10">{materials.data.map((material) => <li key={material.id} className="py-4 first:pt-0"><h3 className="break-words font-semibold">{material.file_name}</h3><p className="mt-2 break-words text-sm text-muted">{material.mime_type} · {new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(material.size_bytes / 1024)} KB</p><p className="mt-1 text-sm text-muted">Added <time dateTime={material.created_at}>{dateFormat.format(new Date(material.created_at))}</time></p></li>)}</ul>}
          </DashboardSection>
        </div>
        <DashboardSection title="Learning Progress" description="Where you stand across all your topics.">
          {!progress ? <DataError section="learning progress" /> : progress.total === 0 ? <EmptyState title="No topics to track yet." detail="Once topics are available, you’ll see your learning progress here." /> : <>
            <p className="mb-5 text-sm text-muted">{progress.total} topics total. Topics without a progress record count as not started.</p>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{statuses.map(({ key, label, color }) => <div key={key} className="rounded-2xl bg-paper p-5"><dt className="flex items-center gap-2 text-sm font-medium text-muted"><span aria-hidden="true" className={`size-2.5 rounded-full ${color}`} />{label}</dt><dd className="mt-3 text-3xl font-semibold">{progress[key]} <span className="text-sm font-normal text-muted">topics</span></dd></div>)}</dl>
          </>}
        </DashboardSection>
      </div>
    </main>
  );
}
