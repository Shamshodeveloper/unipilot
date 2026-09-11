-- Optional instructor information; existing subjects keep a NULL value.
alter table public.subjects add column instructor text;
