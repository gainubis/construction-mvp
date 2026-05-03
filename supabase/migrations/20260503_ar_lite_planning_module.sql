do $$
begin
  alter table public.ar_markers
    add column if not exists notes text;
exception
  when duplicate_column then null;
end
$$;

create index if not exists ar_plans_project_updated_idx
  on public.ar_plans (project_id, updated_at desc);

create index if not exists ar_plans_stage_idx
  on public.ar_plans (stage_id);

create index if not exists ar_markers_plan_sort_idx
  on public.ar_markers (ar_plan_id, sort_order);

do $$
begin
  alter table public.ar_markers
    add constraint ar_markers_x_percent_range_check
    check (x_percent >= 0 and x_percent <= 100);
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  alter table public.ar_markers
    add constraint ar_markers_y_percent_range_check
    check (y_percent >= 0 and y_percent <= 100);
exception
  when duplicate_object then null;
end
$$;

alter table public.ar_plans enable row level security;
alter table public.ar_markers enable row level security;

drop policy if exists "ar_plans_select_member" on public.ar_plans;
drop policy if exists "ar_plans_insert_member" on public.ar_plans;
drop policy if exists "ar_plans_update_member" on public.ar_plans;
drop policy if exists "ar_plans_delete_member" on public.ar_plans;
drop policy if exists "ar_markers_select_member" on public.ar_markers;
drop policy if exists "ar_markers_insert_member" on public.ar_markers;
drop policy if exists "ar_markers_update_member" on public.ar_markers;
drop policy if exists "ar_markers_delete_member" on public.ar_markers;

create policy "ar_plans_select_member"
on public.ar_plans
for select
to authenticated
using (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = ar_plans.project_id
      and pm.profile_id = auth.uid()
  )
);

create policy "ar_plans_insert_member"
on public.ar_plans
for insert
to authenticated
with check (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = ar_plans.project_id
      and pm.profile_id = auth.uid()
  )
);

create policy "ar_plans_update_member"
on public.ar_plans
for update
to authenticated
using (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = ar_plans.project_id
      and pm.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = ar_plans.project_id
      and pm.profile_id = auth.uid()
  )
);

create policy "ar_plans_delete_member"
on public.ar_plans
for delete
to authenticated
using (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = ar_plans.project_id
      and pm.profile_id = auth.uid()
  )
);

create policy "ar_markers_select_member"
on public.ar_markers
for select
to authenticated
using (
  exists (
    select 1
    from public.ar_plans ap
    join public.project_members pm on pm.project_id = ap.project_id
    where ap.id = ar_markers.ar_plan_id
      and pm.profile_id = auth.uid()
  )
);

create policy "ar_markers_insert_member"
on public.ar_markers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.ar_plans ap
    join public.project_members pm on pm.project_id = ap.project_id
    where ap.id = ar_markers.ar_plan_id
      and pm.profile_id = auth.uid()
  )
);

create policy "ar_markers_update_member"
on public.ar_markers
for update
to authenticated
using (
  exists (
    select 1
    from public.ar_plans ap
    join public.project_members pm on pm.project_id = ap.project_id
    where ap.id = ar_markers.ar_plan_id
      and pm.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.ar_plans ap
    join public.project_members pm on pm.project_id = ap.project_id
    where ap.id = ar_markers.ar_plan_id
      and pm.profile_id = auth.uid()
  )
);

create policy "ar_markers_delete_member"
on public.ar_markers
for delete
to authenticated
using (
  exists (
    select 1
    from public.ar_plans ap
    join public.project_members pm on pm.project_id = ap.project_id
    where ap.id = ar_markers.ar_plan_id
      and pm.profile_id = auth.uid()
  )
);

create or replace function public.save_ar_plan_with_markers(
  p_plan_id uuid,
  p_project_id uuid,
  p_stage_id uuid,
  p_uploaded_by uuid,
  p_title text,
  p_wall_photo_path text,
  p_notes text,
  p_markers jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_id uuid;
begin
  if not exists (
    select 1
    from public.project_members pm
    where pm.project_id = p_project_id
      and pm.profile_id = auth.uid()
  ) then
    raise exception 'Not authorized to save this wall plan.';
  end if;

  if p_plan_id is null then
    insert into public.ar_plans (
      project_id,
      stage_id,
      uploaded_by,
      title,
      wall_photo_path,
      notes
    )
    values (
      p_project_id,
      p_stage_id,
      p_uploaded_by,
      p_title,
      p_wall_photo_path,
      p_notes
    )
    returning id into v_plan_id;
  else
    update public.ar_plans
    set
      stage_id = p_stage_id,
      title = p_title,
      wall_photo_path = p_wall_photo_path,
      notes = p_notes,
      updated_at = now()
    where id = p_plan_id
      and project_id = p_project_id
    returning id into v_plan_id;

    if v_plan_id is null then
      raise exception 'AR plan was not found.';
    end if;
  end if;

  delete from public.ar_markers
  where ar_plan_id = v_plan_id;

  insert into public.ar_markers (
    id,
    ar_plan_id,
    marker_type,
    x_percent,
    y_percent,
    label,
    notes,
    sort_order
  )
  select
    coalesce(marker_row.id, gen_random_uuid()),
    v_plan_id,
    marker_row.marker_type::public.marker_type,
    marker_row.x_percent,
    marker_row.y_percent,
    nullif(marker_row.label, ''),
    nullif(marker_row.notes, ''),
    coalesce(marker_row.sort_order, row_number() over ())
  from jsonb_to_recordset(coalesce(p_markers, '[]'::jsonb)) as marker_row(
    id uuid,
    marker_type text,
    x_percent numeric,
    y_percent numeric,
    label text,
    notes text,
    sort_order integer
  );

  return v_plan_id;
end;
$$;

insert into storage.buckets (id, name, public)
values ('ar-wall-photos', 'ar-wall-photos', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "ar_wall_photos_public_select" on storage.objects;
drop policy if exists "ar_wall_photos_authenticated_insert" on storage.objects;
drop policy if exists "ar_wall_photos_authenticated_update" on storage.objects;
drop policy if exists "ar_wall_photos_authenticated_delete" on storage.objects;

create policy "ar_wall_photos_public_select"
on storage.objects
for select
using (bucket_id = 'ar-wall-photos');

create policy "ar_wall_photos_authenticated_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'ar-wall-photos');

create policy "ar_wall_photos_authenticated_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'ar-wall-photos')
with check (bucket_id = 'ar-wall-photos');

create policy "ar_wall_photos_authenticated_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'ar-wall-photos');
