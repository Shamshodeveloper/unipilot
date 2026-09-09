-- UniPilot Milestone 2: metadata and owner-isolated academic records.
begin;

create type public.topic_learning_status as enum (
  'not_started', 'learning', 'needs_review', 'mastered'
);

create type public.generated_content_type as enum (
  'explanation', 'example', 'quiz', 'practice'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 200),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid not null,
  file_name text not null check (char_length(btrim(file_name)) between 1 and 255),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  -- Optional until file upload exists; never store a public or signed URL here.
  storage_path text check (storage_path is null or char_length(btrim(storage_path)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, subject_id, user_id),
  unique (user_id, storage_path),
  foreign key (subject_id, user_id)
    references public.subjects (id, user_id) on delete cascade,
  constraint materials_supported_file check (
    (mime_type = 'application/pdf' and file_name ~* '\.pdf$')
    or (mime_type = 'image/png' and file_name ~* '\.png$')
    or (mime_type = 'image/jpeg' and file_name ~* '\.jpe?g$')
    or (mime_type = 'image/webp' and file_name ~* '\.webp$')
  )
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid not null,
  material_id uuid,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (subject_id, user_id)
    references public.subjects (id, user_id) on delete cascade,
  -- A source material must belong to both the same owner and the same subject.
  foreign key (material_id, subject_id, user_id)
    references public.materials (id, subject_id, user_id)
    on delete set null (material_id)
);

create table public.topic_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id uuid not null,
  status public.topic_learning_status not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (topic_id, user_id),
  foreign key (topic_id, user_id)
    references public.topics (id, user_id) on delete cascade
);

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid not null,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  exam_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (subject_id, user_id)
    references public.subjects (id, user_id) on delete cascade
);

create table public.generated_content (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id uuid not null,
  content_type public.generated_content_type not null,
  -- Type-specific validation belongs to the future generation milestone.
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (topic_id, user_id)
    references public.topics (id, user_id) on delete cascade
);

-- Owner-first indexes serve RLS filters and the expected list queries.
-- Primary keys and unique constraints already create their own indexes.
create index subjects_user_id_idx on public.subjects (user_id);
create index materials_user_subject_idx on public.materials (user_id, subject_id);
create index topics_user_subject_idx on public.topics (user_id, subject_id);
create index topics_material_subject_user_idx on public.topics (material_id, subject_id, user_id);
create index topic_progress_user_status_idx on public.topic_progress (user_id, status);
create index exams_user_date_idx on public.exams (user_id, exam_date);
create index exams_subject_user_idx on public.exams (subject_id, user_id);
create index generated_content_user_topic_idx on public.generated_content (user_id, topic_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_at := old.created_at;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Explicit grants avoid relying on project-specific default privileges.
revoke all on table public.profiles from public, anon, authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;

create policy profiles_owner_access
on public.profiles
for all
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create trigger subjects_updated_at
before update on public.subjects
for each row execute function public.set_updated_at();

alter table public.subjects enable row level security;

-- Explicit grants avoid relying on project-specific default privileges.
revoke all on table public.subjects from public, anon, authenticated;
grant select, insert, update, delete on table public.subjects to authenticated;

create policy subjects_owner_access
on public.subjects
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create trigger materials_updated_at
before update on public.materials
for each row execute function public.set_updated_at();

alter table public.materials enable row level security;

-- Explicit grants avoid relying on project-specific default privileges.
revoke all on table public.materials from public, anon, authenticated;
grant select, insert, update, delete on table public.materials to authenticated;

create policy materials_owner_access
on public.materials
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create trigger topics_updated_at
before update on public.topics
for each row execute function public.set_updated_at();

alter table public.topics enable row level security;

-- Explicit grants avoid relying on project-specific default privileges.
revoke all on table public.topics from public, anon, authenticated;
grant select, insert, update, delete on table public.topics to authenticated;

create policy topics_owner_access
on public.topics
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create trigger topic_progress_updated_at
before update on public.topic_progress
for each row execute function public.set_updated_at();

alter table public.topic_progress enable row level security;

-- Explicit grants avoid relying on project-specific default privileges.
revoke all on table public.topic_progress from public, anon, authenticated;
grant select, insert, update, delete on table public.topic_progress to authenticated;

create policy topic_progress_owner_access
on public.topic_progress
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create trigger exams_updated_at
before update on public.exams
for each row execute function public.set_updated_at();

alter table public.exams enable row level security;

-- Explicit grants avoid relying on project-specific default privileges.
revoke all on table public.exams from public, anon, authenticated;
grant select, insert, update, delete on table public.exams to authenticated;

create policy exams_owner_access
on public.exams
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create trigger generated_content_updated_at
before update on public.generated_content
for each row execute function public.set_updated_at();

alter table public.generated_content enable row level security;

-- Explicit grants avoid relying on project-specific default privileges.
revoke all on table public.generated_content from public, anon, authenticated;
grant select, insert, update, delete on table public.generated_content to authenticated;

create policy generated_content_owner_access
on public.generated_content
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

commit;
