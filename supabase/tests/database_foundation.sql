-- Run after the migration on a disposable Supabase database as postgres.
-- The test fixtures and helper functions are rolled back, including on success.
begin;

create function pg_temp.expect_error(command text, expected_state text)
returns void language plpgsql as $$
begin
  begin
    execute command;
  exception when others then
    if sqlstate = expected_state then return; end if;
    raise exception 'Expected SQLSTATE %, got %: %', expected_state, sqlstate, sqlerrm;
  end;
  raise exception 'Expected SQLSTATE %, but command succeeded: %', expected_state, command;
end;
$$;

insert into auth.users (id) values ('10000000-0000-4000-8000-000000000001'), ('10000000-0000-4000-8000-000000000002');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
insert into public.profiles (id, display_name) values ('10000000-0000-4000-8000-000000000001', 'Test student 1');
insert into public.subjects (id, user_id, name) values ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Mathematics');
insert into public.materials (id, user_id, subject_id, file_name, mime_type, size_bytes)
values ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'lecture.PDF', 'application/pdf', 1024);
insert into public.topics (id, user_id, subject_id, material_id, title)
values ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Limits');
insert into public.topic_progress (id, user_id, topic_id)
values ('50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001');
insert into public.exams (id, user_id, subject_id, title, exam_date)
values ('60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Midterm', '2026-12-01');
insert into public.generated_content (id, user_id, topic_id, content_type, content)
values ('70000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'explanation', '{"text":"Test fixture only"}');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
insert into public.profiles (id, display_name) values ('10000000-0000-4000-8000-000000000002', 'Test student 2');
insert into public.subjects (id, user_id, name) values ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Mathematics');
insert into public.materials (id, user_id, subject_id, file_name, mime_type, size_bytes)
values ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'lecture.PDF', 'application/pdf', 1024);
insert into public.topics (id, user_id, subject_id, material_id, title)
values ('40000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 'Limits');
insert into public.topic_progress (id, user_id, topic_id)
values ('50000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002');
insert into public.exams (id, user_id, subject_id, title, exam_date)
values ('60000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'Midterm', '2026-12-01');
insert into public.generated_content (id, user_id, topic_id, content_type, content)
values ('70000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 'explanation', '{"text":"Test fixture only"}');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

-- Verify every table, not just subjects, enforces owner isolation on all operations.
do $$
declare
  table_name text;
  owner_column text;
  visible_count bigint;
  affected_count bigint;
begin
  foreach table_name in array array['profiles', 'subjects', 'materials', 'topics', 'topic_progress', 'exams', 'generated_content'] loop
    owner_column := case when table_name = 'profiles' then 'id' else 'user_id' end;
    execute format('select count(*) from public.%I', table_name) into visible_count;
    if visible_count <> 1 then
      raise exception 'Expected exactly one visible own row in %, got %', table_name, visible_count;
    end if;

    execute format('update public.%I set updated_at = now() where %I = %L',
      table_name, owner_column, '10000000-0000-4000-8000-000000000002');
    get diagnostics affected_count = row_count;
    if affected_count <> 0 then raise exception 'Cross-user update allowed in %', table_name; end if;

    execute format('delete from public.%I where %I = %L',
      table_name, owner_column, '10000000-0000-4000-8000-000000000002');
    get diagnostics affected_count = row_count;
    if affected_count <> 0 then raise exception 'Cross-user delete allowed in %', table_name; end if;

    perform pg_temp.expect_error(
      format('update public.%I set %I = %L', table_name, owner_column, '10000000-0000-4000-8000-000000000002'), '42501');

    -- Clone a valid row but attempt to assign it to the other user.
    perform pg_temp.expect_error(format(
      'insert into public.%1$I select (jsonb_populate_record(null::public.%1$I,
       to_jsonb(t) || jsonb_build_object(''id'', %2$L, %3$L, %4$L))).*
       from public.%1$I t limit 1',
      table_name, gen_random_uuid(), owner_column, '10000000-0000-4000-8000-000000000002'), '42501');

    execute format('update public.%I set updated_at = ''2000-01-01'', created_at = ''2000-01-01''',
      table_name);
    get diagnostics affected_count = row_count;
    if affected_count <> 1 then raise exception 'Own update failed in %', table_name; end if;
    execute format('select count(*) from public.%I where updated_at > created_at and created_at = now()',
      table_name) into visible_count;
    if visible_count <> 1 then raise exception 'Timestamp trigger failed in %', table_name; end if;
  end loop;
end;
$$;

-- Even an owned row cannot reference someone else's subject or topic.
select pg_temp.expect_error(
  $q$insert into public.materials (user_id, subject_id, file_name, mime_type, size_bytes)
     values ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'a.pdf', 'application/pdf', 10)$q$, '23503');
select pg_temp.expect_error(
  $q$update public.topics set subject_id = '20000000-0000-4000-8000-000000000002'$q$, '23503');
select pg_temp.expect_error(
  $q$update public.topics set material_id = '30000000-0000-4000-8000-000000000002'$q$, '23503');
select pg_temp.expect_error(
  $q$update public.topic_progress set topic_id = '40000000-0000-4000-8000-000000000002'$q$, '23503');
select pg_temp.expect_error(
  $q$update public.exams set subject_id = '20000000-0000-4000-8000-000000000002'$q$, '23503');
select pg_temp.expect_error(
  $q$update public.generated_content set topic_id = '40000000-0000-4000-8000-000000000002'$q$, '23503');

-- A source material from another subject is also invalid, even for the same owner.
insert into public.subjects (id, user_id, name)
values ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Physics');
select pg_temp.expect_error(
  $q$update public.topics set subject_id = '20000000-0000-4000-8000-000000000003'$q$, '23503');

select pg_temp.expect_error(
  $q$insert into public.topic_progress (user_id, topic_id)
     values ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001')$q$, '23505');
select pg_temp.expect_error($q$update public.topic_progress set status = 'complete'$q$, '22P02');
select pg_temp.expect_error($q$update public.generated_content set content_type = 'essay'$q$, '22P02');
select pg_temp.expect_error($q$update public.generated_content set content = '[]'$q$, '23514');
select pg_temp.expect_error($q$update public.materials set size_bytes = 0$q$, '23514');
select pg_temp.expect_error($q$update public.materials set file_name = 'script.exe'$q$, '23514');
select pg_temp.expect_error($q$update public.materials set mime_type = 'image/png'$q$, '23514');
select pg_temp.expect_error($q$update public.subjects set name = ' '$q$, '23514');

do $$
declare value text;
begin
  if (select status from public.topic_progress) <> 'not_started' then
    raise exception 'Incorrect progress default';
  end if;
  foreach value in array array['not_started', 'learning', 'needs_review', 'mastered'] loop
    update public.topic_progress set status = value::public.topic_learning_status;
  end loop;
  foreach value in array array['explanation', 'example', 'quiz', 'practice'] loop
    update public.generated_content set content_type = value::public.generated_content_type;
  end loop;
end;
$$;

-- Without an authenticated identity, RLS still hides data.
select set_config('request.jwt.claim.sub', '', true);
do $$
declare table_name text; visible_count bigint;
begin
  foreach table_name in array array['profiles', 'subjects', 'materials', 'topics', 'topic_progress', 'exams', 'generated_content'] loop
    execute format('select count(*) from public.%I', table_name) into visible_count;
    if visible_count <> 0 then raise exception 'Missing identity can read %', table_name; end if;
  end loop;
end;
$$;
reset role;

-- The public API's anon role has no table privileges.
set local role anon;
do $$
declare table_name text;
begin
  foreach table_name in array array['profiles', 'subjects', 'materials', 'topics', 'topic_progress', 'exams', 'generated_content'] loop
    perform pg_temp.expect_error(format('select * from public.%I', table_name), '42501');
    perform pg_temp.expect_error(format('insert into public.%I default values', table_name), '42501');
    perform pg_temp.expect_error(format('update public.%I set updated_at = now()', table_name), '42501');
    perform pg_temp.expect_error(format('delete from public.%I', table_name), '42501');
  end loop;
end;
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

-- Removing metadata keeps the topic and clears only its optional source.
delete from public.materials where id = '30000000-0000-4000-8000-000000000001';
do $$
begin
  if not exists (select 1 from public.topics where id = '40000000-0000-4000-8000-000000000001' and material_id is null) then
    raise exception 'Deleting material did not preserve its topic';
  end if;
end;
$$;

-- Verify owners can delete every table directly.
delete from public.generated_content;
delete from public.topic_progress;
delete from public.exams;
delete from public.topics;
delete from public.subjects;
delete from public.profiles;
do $$
declare table_name text; visible_count bigint;
begin
  foreach table_name in array array['profiles', 'subjects', 'materials', 'topics', 'topic_progress', 'exams', 'generated_content'] loop
    execute format('select count(*) from public.%I', table_name) into visible_count;
    if visible_count <> 0 then raise exception 'Own delete failed in %', table_name; end if;
  end loop;
end;
$$;
reset role;

-- The other user's rows survived; deleting that auth user cascades to all tables.
do $$
declare table_name text; row_count bigint;
begin
  foreach table_name in array array['profiles', 'subjects', 'materials', 'topics', 'topic_progress', 'exams', 'generated_content'] loop
    execute format('select count(*) from public.%I', table_name) into row_count;
    if row_count <> 1 then raise exception 'Unexpected remaining rows in %', table_name; end if;
  end loop;
end;
$$;
delete from auth.users where id = '10000000-0000-4000-8000-000000000002';
do $$
declare table_name text; row_count bigint;
begin
  foreach table_name in array array['profiles', 'subjects', 'materials', 'topics', 'topic_progress', 'exams', 'generated_content'] loop
    execute format('select count(*) from public.%I', table_name) into row_count;
    if row_count <> 0 then raise exception 'User deletion did not cascade to %', table_name; end if;
  end loop;
end;
$$;

rollback;
