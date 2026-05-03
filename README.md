# ConstructFlow

Construction project management SaaS MVP built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase.

## What is implemented

- Responsive app shell with sidebar navigation and top header
- Real Supabase authentication flow with email/password login
- Session persistence via secure server-side cookies
- Logout support
- Route protection for authenticated app pages
- Role-aware navigation for `admin`, `foreman`, `engineer`, and `worker`
- Profile-aware UI that reads the current user and role
- Loading and empty states for the main workspace routes
- AI-generated inspection summaries powered by a server-side OpenAI integration
- AR-lite wall planning with draggable markers on wall photos
- Stage completion with digital signatures and generated PDF acts

## Run locally

```bash
npm run dev
```

## Required environment variables

Set these in `.env.local` with your real Supabase project values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=your-openai-api-key
OPENAI_INSPECTION_SUMMARY_MODEL=gpt-4o-mini
```

The app does not expose secrets to the client. Only the public Supabase URL and anon key are used on the client side. The OpenAI key stays server-side and is only used by the report regeneration API route and the inspection submission server action.

### AR planning setup

- The AR planning migration creates the `ar-wall-photos` storage bucket and adds the `notes` field to `ar_markers`.
- Use `/projects/[id]/ar` to upload a wall photo, place markers, and save the layout.
- Saved wall plans appear in the archive list so teams can reopen and edit them later.

### Stage completion and acts

- The stage completion migration creates the `act-pdfs` storage bucket and RLS policies for the `acts` table.
- Use `/projects/[id]/stages/[stageId]/complete` to review the latest inspection, capture a signature, and generate the final act PDF.
- Generated acts appear on the stage page and the project-level `/projects/[id]/acts` page with view/download links.

## Supabase setup required

1. Create a Supabase project.
2. Enable Email/Password authentication in Supabase Auth.
3. Create the `profiles` table and role enum.
4. Add RLS policies so users can read and update their own profile.
5. Add a trigger to create a profile row when a new auth user is created.
6. Create demo users in Supabase Auth and set their roles in `profiles`.
7. Run the inspection workflow migration, the AI summary migration, the safety migration, the AR planning migration, and the stage completion act migration in `supabase/migrations`.

### SQL for the profiles table

```sql
create type public.user_role as enum ('admin', 'foreman', 'engineer', 'worker');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role public.user_role not null default 'worker',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'worker'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        role = excluded.role,
        avatar_url = excluded.avatar_url,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create policy "Profiles are readable by owner"
on public.profiles
for select
using (auth.uid() = id);

create policy "Profiles are updateable by owner"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);
```

### Demo user setup

- Create one user per role in Supabase Auth.
- Set `full_name` and `role` in the profile row for each account.
- If email confirmation is enabled, confirm the demo users first or disable confirmations for the demo workspace.

## Auth flow

- `proxy.ts` checks session cookies before protected routes render.
- `/login` uses a server action to call Supabase Auth with email/password.
- The app layout loads the current user profile server-side and passes it into the shell.
- The header includes a profile menu with logout.
- Daily inspection submissions create a report, store inspection results, and generate an AI summary server-side.
- `/projects/[id]/reports/[reportId]` shows raw checklist results, photos, and the AI summary with retry support.
- `POST /api/reports/[reportId]/ai-summary` regenerates the AI summary without exposing the OpenAI API key to the browser.
- Stage completion captures a signature, generates a PDF act, updates project progress, and stores the signed output in Supabase Storage.

## Demo walkthrough

1. Sign in at `/login` with one of the demo users.
2. Open `/dashboard` to review portfolio KPIs, recent reports, safety issues, and upcoming deadlines.
3. Visit `/projects` to search, filter, and open a project.
4. Use `/projects/[id]` to review the project summary, timeline, floor plan, and stage list.
5. Open a stage to run a daily inspection, attach photos, and submit a report.
6. Use the safety flow to log incidents and assign follow-up work.
7. Open `/projects/[id]/ar` to place wall-plan markers for sockets, pipes, switches, and light points.
8. Complete a stage from `/projects/[id]/stages/[stageId]/complete` to capture a signature and generate the PDF act.
9. Review signed acts in `/projects/[id]/acts`.

## Main user journeys

- `Admin`: creates projects, manages users, reviews acts, and monitors portfolio health.
- `Foreman`: tracks daily progress, reads safety notifications, and keeps work moving on site.
- `Engineer`: reviews stage readiness, checks reports, and signs completion acts.
- `Worker`: logs inspections, uploads evidence, and supports AR planning and field execution.

## Scripts

```bash
npm run dev
npm run lint
npm run build
```
