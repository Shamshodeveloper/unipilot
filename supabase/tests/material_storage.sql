-- Only temporary fixture rows are inserted; no real file blobs are created.
begin;
create function pg_temp.storage_expect_denied(command text) returns void language plpgsql as $$
begin
  begin execute command;
  exception when insufficient_privilege then return; end;
  raise exception 'Expected denied operation: %', command;
end $$;
do $$ begin
  if not exists (select 1 from storage.buckets where id = 'academic-materials' and not public and file_size_limit = 20971520 and allowed_mime_types @> array['application/pdf','image/png','image/jpeg','image/webp'] and cardinality(allowed_mime_types) = 4) then raise exception 'Bucket restrictions incorrect'; end if;
end $$;
insert into auth.users (id) values ('10000000-0000-4000-8000-000000000061'), ('10000000-0000-4000-8000-000000000062');
insert into public.subjects (id, user_id, name) values ('20000000-0000-4000-8000-000000000061','10000000-0000-4000-8000-000000000061','Storage fixture');
-- Supabase Storage uses this transaction-local switch for API object deletion.
select set_config('storage.allow_delete_query', 'true', true);
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000061',true);
insert into storage.objects (bucket_id, name) values ('academic-materials','10000000-0000-4000-8000-000000000061/20000000-0000-4000-8000-000000000061/30000000-0000-4000-8000-000000000061.pdf');
do $$ begin
  if (select count(*) from storage.objects where bucket_id='academic-materials' and name like '10000000-0000-4000-8000-000000000061/%') <> 1 then raise exception 'Owner cannot read'; end if;
end $$;
select pg_temp.storage_expect_denied($q$insert into storage.objects (bucket_id,name) values ('academic-materials','10000000-0000-4000-8000-000000000061/20000000-0000-4000-8000-000000000061/unsafe.exe')$q$);
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000062',true);
select pg_temp.storage_expect_denied($q$insert into storage.objects (bucket_id,name) values ('academic-materials','10000000-0000-4000-8000-000000000061/20000000-0000-4000-8000-000000000061/30000000-0000-4000-8000-000000000062.pdf')$q$);
select pg_temp.storage_expect_denied($q$insert into storage.objects (bucket_id,name) values ('academic-materials','10000000-0000-4000-8000-000000000062/20000000-0000-4000-8000-000000000061/30000000-0000-4000-8000-000000000062.pdf')$q$);
do $$ declare affected integer; begin
  if exists (select 1 from storage.objects where bucket_id='academic-materials' and name like '10000000-0000-4000-8000-000000000061/%') then raise exception 'Foreign file readable'; end if;
  delete from storage.objects where bucket_id='academic-materials' and name like '10000000-0000-4000-8000-000000000061/%';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Foreign file deletable'; end if;
end $$;
reset role;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$ begin
  if exists (select 1 from storage.objects where bucket_id='academic-materials' and name like '10000000-0000-4000-8000-000000000061/%') then raise exception 'Anonymous file readable'; end if;
exception when insufficient_privilege then null;
end $$;
select pg_temp.storage_expect_denied($q$insert into storage.objects (bucket_id,name) values ('academic-materials','10000000-0000-4000-8000-000000000061/20000000-0000-4000-8000-000000000061/30000000-0000-4000-8000-000000000062.pdf')$q$);
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000061',true);
do $$ declare affected integer; begin
  delete from storage.objects where bucket_id='academic-materials' and name like '10000000-0000-4000-8000-000000000061/%';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Owner delete failed'; end if;
end $$;
reset role;
rollback;
