create extension if not exists pgcrypto;

do $$
begin
  create type public.inspection_result as enum ('passed', 'failed', 'not_applicable');
exception
  when duplicate_object then null;
end
$$;

alter table public.stage_reports
add column if not exists inspector_comments text;

create table if not exists public.inspection_item_results (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.stage_reports(id) on delete cascade,
  checklist_item_id uuid not null references public.checklist_items(id) on delete cascade,
  result public.inspection_result not null,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (report_id, checklist_item_id)
);

create index if not exists inspection_item_results_report_id_idx
  on public.inspection_item_results (report_id);

create index if not exists inspection_item_results_checklist_item_id_idx
  on public.inspection_item_results (checklist_item_id);

create index if not exists stage_reports_stage_id_report_date_idx
  on public.stage_reports (stage_id, report_date desc);

create index if not exists checklist_items_checklist_id_sort_order_idx
  on public.checklist_items (checklist_id, sort_order);

alter table public.stage_reports enable row level security;
alter table public.checklists enable row level security;
alter table public.checklist_items enable row level security;
alter table public.report_photos enable row level security;
alter table public.inspection_item_results enable row level security;

drop policy if exists "stage_reports_authenticated_select" on public.stage_reports;
drop policy if exists "stage_reports_authenticated_write" on public.stage_reports;
create policy "stage_reports_authenticated_select"
on public.stage_reports
for select
to authenticated
using (true);

create policy "stage_reports_authenticated_write"
on public.stage_reports
for all
to authenticated
using (true)
with check (true);

drop policy if exists "checklists_authenticated_select" on public.checklists;
drop policy if exists "checklists_authenticated_write" on public.checklists;
create policy "checklists_authenticated_select"
on public.checklists
for select
to authenticated
using (true);

create policy "checklists_authenticated_write"
on public.checklists
for all
to authenticated
using (true)
with check (true);

drop policy if exists "checklist_items_authenticated_select" on public.checklist_items;
drop policy if exists "checklist_items_authenticated_write" on public.checklist_items;
create policy "checklist_items_authenticated_select"
on public.checklist_items
for select
to authenticated
using (true);

create policy "checklist_items_authenticated_write"
on public.checklist_items
for all
to authenticated
using (true)
with check (true);

drop policy if exists "inspection_item_results_authenticated_select" on public.inspection_item_results;
drop policy if exists "inspection_item_results_authenticated_write" on public.inspection_item_results;
create policy "inspection_item_results_authenticated_select"
on public.inspection_item_results
for select
to authenticated
using (true);

create policy "inspection_item_results_authenticated_write"
on public.inspection_item_results
for all
to authenticated
using (true)
with check (true);

drop policy if exists "report_photos_authenticated_select" on public.report_photos;
drop policy if exists "report_photos_authenticated_write" on public.report_photos;
create policy "report_photos_authenticated_select"
on public.report_photos
for select
to authenticated
using (true);

create policy "report_photos_authenticated_write"
on public.report_photos
for all
to authenticated
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values ('inspection-photos', 'inspection-photos', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "inspection_photos_public_select" on storage.objects;
drop policy if exists "inspection_photos_authenticated_insert" on storage.objects;
drop policy if exists "inspection_photos_authenticated_update" on storage.objects;
drop policy if exists "inspection_photos_authenticated_delete" on storage.objects;

create policy "inspection_photos_public_select"
on storage.objects
for select
using (bucket_id = 'inspection-photos');

create policy "inspection_photos_authenticated_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'inspection-photos');

create policy "inspection_photos_authenticated_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'inspection-photos')
with check (bucket_id = 'inspection-photos');

create policy "inspection_photos_authenticated_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'inspection-photos');
