-- Private academic files. Existing public-table policies are unchanged.
begin;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('academic-materials', 'academic-materials', false, 20971520,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = false,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Paths: authenticated-user/owned-subject/generated-UUID.extension.
drop policy if exists academic_materials_insert on storage.objects;
create policy academic_materials_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'academic-materials'
  and split_part(name, '/', 1) = (select auth.uid())::text
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|png|jpg|jpeg|webp)$'
  and exists (select 1 from public.subjects s
    where s.id::text = split_part(name, '/', 2) and s.user_id = (select auth.uid()))
);

drop policy if exists academic_materials_select on storage.objects;
create policy academic_materials_select on storage.objects for select to authenticated
using (bucket_id = 'academic-materials' and split_part(name, '/', 1) = (select auth.uid())::text);

-- Keep owner cleanup possible even if the subject was deleted concurrently.
drop policy if exists academic_materials_delete on storage.objects;
create policy academic_materials_delete on storage.objects for delete to authenticated
using (bucket_id = 'academic-materials' and split_part(name, '/', 1) = (select auth.uid())::text);
-- No UPDATE policy: uploads cannot overwrite existing objects.
commit;
