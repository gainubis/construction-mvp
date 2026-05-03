create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'safety_violations_violation_type_check'
  ) then
    alter table public.safety_violations
      add constraint safety_violations_violation_type_check
      check (violation_type in (
        'no_helmet',
        'no_gloves',
        'unsafe_zone',
        'improper_tool_storage',
        'blocked_passage'
      ));
  end if;
end
$$;

create table if not exists public.safety_violation_photos (
  id uuid primary key default gen_random_uuid(),
  violation_id uuid not null references public.safety_violations(id) on delete cascade,
  storage_path text not null,
  caption text,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists safety_violations_project_id_occurred_at_idx
  on public.safety_violations (project_id, occurred_at desc);

create index if not exists safety_violations_project_id_status_idx
  on public.safety_violations (project_id, status);

create index if not exists safety_violations_project_id_severity_idx
  on public.safety_violations (project_id, severity);

create index if not exists safety_violations_project_id_violation_type_idx
  on public.safety_violations (project_id, violation_type);

create index if not exists safety_violation_photos_violation_id_sort_order_idx
  on public.safety_violation_photos (violation_id, sort_order);

alter table public.safety_violations enable row level security;
alter table public.safety_violation_photos enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "safety_violations_select_member" on public.safety_violations;
drop policy if exists "safety_violations_insert_member" on public.safety_violations;
drop policy if exists "safety_violations_update_member" on public.safety_violations;
drop policy if exists "safety_violations_delete_member" on public.safety_violations;

create policy "safety_violations_select_member"
on public.safety_violations
for select
to authenticated
using (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = safety_violations.project_id
      and pm.profile_id = auth.uid()
  )
);

create policy "safety_violations_insert_member"
on public.safety_violations
for insert
to authenticated
with check (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = safety_violations.project_id
      and pm.profile_id = auth.uid()
  )
);

create policy "safety_violations_update_member"
on public.safety_violations
for update
to authenticated
using (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = safety_violations.project_id
      and pm.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = safety_violations.project_id
      and pm.profile_id = auth.uid()
  )
);

create policy "safety_violations_delete_member"
on public.safety_violations
for delete
to authenticated
using (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = safety_violations.project_id
      and pm.profile_id = auth.uid()
  )
);

drop policy if exists "safety_violation_photos_select_member" on public.safety_violation_photos;
drop policy if exists "safety_violation_photos_insert_member" on public.safety_violation_photos;
drop policy if exists "safety_violation_photos_update_member" on public.safety_violation_photos;
drop policy if exists "safety_violation_photos_delete_member" on public.safety_violation_photos;

create policy "safety_violation_photos_select_member"
on public.safety_violation_photos
for select
to authenticated
using (
  exists (
    select 1
    from public.safety_violations v
    join public.project_members pm on pm.project_id = v.project_id
    where v.id = safety_violation_photos.violation_id
      and pm.profile_id = auth.uid()
  )
);

create policy "safety_violation_photos_insert_member"
on public.safety_violation_photos
for insert
to authenticated
with check (
  exists (
    select 1
    from public.safety_violations v
    join public.project_members pm on pm.project_id = v.project_id
    where v.id = safety_violation_photos.violation_id
      and pm.profile_id = auth.uid()
  )
);

create policy "safety_violation_photos_update_member"
on public.safety_violation_photos
for update
to authenticated
using (
  exists (
    select 1
    from public.safety_violations v
    join public.project_members pm on pm.project_id = v.project_id
    where v.id = safety_violation_photos.violation_id
      and pm.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.safety_violations v
    join public.project_members pm on pm.project_id = v.project_id
    where v.id = safety_violation_photos.violation_id
      and pm.profile_id = auth.uid()
  )
);

create policy "safety_violation_photos_delete_member"
on public.safety_violation_photos
for delete
to authenticated
using (
  exists (
    select 1
    from public.safety_violations v
    join public.project_members pm on pm.project_id = v.project_id
    where v.id = safety_violation_photos.violation_id
      and pm.profile_id = auth.uid()
  )
);

drop policy if exists "notifications_select_own" on public.notifications;
drop policy if exists "notifications_insert_foreman" on public.notifications;
drop policy if exists "notifications_update_own" on public.notifications;

create policy "notifications_select_own"
on public.notifications
for select
to authenticated
using (recipient_id = auth.uid());

create policy "notifications_insert_foreman"
on public.notifications
for insert
to authenticated
with check (
  exists (
    select 1
    from public.project_members sender
    join public.project_members recipient
      on recipient.project_id = sender.project_id
    where sender.profile_id = auth.uid()
      and sender.project_id = notifications.project_id
      and recipient.profile_id = notifications.recipient_id
      and recipient.role = 'foreman'
  )
);

create policy "notifications_update_own"
on public.notifications
for update
to authenticated
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('safety-evidence', 'safety-evidence', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "safety_evidence_public_select" on storage.objects;
drop policy if exists "safety_evidence_authenticated_insert" on storage.objects;
drop policy if exists "safety_evidence_authenticated_update" on storage.objects;
drop policy if exists "safety_evidence_authenticated_delete" on storage.objects;

create policy "safety_evidence_public_select"
on storage.objects
for select
using (bucket_id = 'safety-evidence');

create policy "safety_evidence_authenticated_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'safety-evidence');

create policy "safety_evidence_authenticated_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'safety-evidence')
with check (bucket_id = 'safety-evidence');

create policy "safety_evidence_authenticated_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'safety-evidence');
