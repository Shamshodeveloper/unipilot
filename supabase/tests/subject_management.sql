-- Run on a disposable database after both migrations. No fixtures are retained.
begin;
insert into auth.users (id) values ('10000000-0000-4000-8000-000000000071'), ('10000000-0000-4000-8000-000000000072');
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000071', true);
insert into public.subjects (id, user_id, name) values ('20000000-0000-4000-8000-000000000071', auth.uid(), 'Subject without instructor');
do $$ begin
  if (select instructor from public.subjects where id = '20000000-0000-4000-8000-000000000071') is not null then raise exception 'Instructor must default to NULL'; end if;
end $$;
update public.subjects set instructor = 'Professor Test' where id = '20000000-0000-4000-8000-000000000071';
do $$ begin
  if (select instructor from public.subjects where id = '20000000-0000-4000-8000-000000000071') <> 'Professor Test' then raise exception 'Owner instructor update failed'; end if;
end $$;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000072', true);
do $$ declare affected integer; begin
  if exists (select 1 from public.subjects where id = '20000000-0000-4000-8000-000000000071') then raise exception 'Foreign subject readable'; end if;
  update public.subjects set instructor = 'Intruder' where id = '20000000-0000-4000-8000-000000000071';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Foreign subject editable'; end if;
  delete from public.subjects where id = '20000000-0000-4000-8000-000000000071';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Foreign subject deletable'; end if;
end $$;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000071', true);
update public.subjects set instructor = null where id = '20000000-0000-4000-8000-000000000071';
delete from public.subjects where id = '20000000-0000-4000-8000-000000000071';
do $$ begin
  if exists (select 1 from public.subjects where id = '20000000-0000-4000-8000-000000000071') then raise exception 'Owner delete failed'; end if;
end $$;
reset role;
rollback;
