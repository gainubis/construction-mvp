create extension if not exists pgcrypto;

do $$
begin
  create type public.act_status as enum ('draft', 'pending_signature', 'signed', 'archived');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.acts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  stage_id uuid not null references public.stages(id) on delete cascade,
  prepared_by uuid not null references public.profiles(id) on delete restrict,
  signed_by uuid references public.profiles(id) on delete set null,
  act_number text not null unique,
  status public.act_status not null default 'draft',
  summary text,
  signed_at timestamptz,
  pdf_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists acts_project_id_created_at_idx
  on public.acts (project_id, created_at desc);

create index if not exists acts_stage_id_created_at_idx
  on public.acts (stage_id, created_at desc);

create index if not exists acts_signed_at_idx
  on public.acts (signed_at desc);

alter table public.acts enable row level security;

drop policy if exists "acts_project_member_select" on public.acts;
drop policy if exists "acts_project_member_insert" on public.acts;
drop policy if exists "acts_project_member_update" on public.acts;
drop policy if exists "acts_project_member_delete" on public.acts;

create policy "acts_project_member_select"
on public.acts
for select
to authenticated
using (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = acts.project_id
      and pm.profile_id = auth.uid()
  )
);

create policy "acts_project_member_insert"
on public.acts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = acts.project_id
      and pm.profile_id = auth.uid()
  )
);

create policy "acts_project_member_update"
on public.acts
for update
to authenticated
using (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = acts.project_id
      and pm.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = acts.project_id
      and pm.profile_id = auth.uid()
  )
);

create policy "acts_project_member_delete"
on public.acts
for delete
to authenticated
using (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = acts.project_id
      and pm.profile_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('act-pdfs', 'act-pdfs', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "act_pdfs_public_select" on storage.objects;
drop policy if exists "act_pdfs_authenticated_insert" on storage.objects;
drop policy if exists "act_pdfs_authenticated_update" on storage.objects;
drop policy if exists "act_pdfs_authenticated_delete" on storage.objects;

create policy "act_pdfs_public_select"
on storage.objects
for select
using (bucket_id = 'act-pdfs');

create policy "act_pdfs_authenticated_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'act-pdfs');

create policy "act_pdfs_authenticated_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'act-pdfs')
with check (bucket_id = 'act-pdfs');

create policy "act_pdfs_authenticated_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'act-pdfs');
