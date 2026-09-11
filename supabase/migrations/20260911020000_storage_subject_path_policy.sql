-- Qualify the object path inside the subject lookup (subjects also has a name column).
begin;
drop policy if exists academic_materials_insert on storage.objects;
create policy academic_materials_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'academic-materials'
  and split_part(name, '/', 1) = (select auth.uid())::text
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|png|jpg|jpeg|webp)$'
  and exists (select 1 from public.subjects s
    where s.id::text = split_part(storage.objects.name, '/', 2) and s.user_id = (select auth.uid()))
);
commit;
