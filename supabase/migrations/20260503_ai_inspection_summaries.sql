alter table public.stage_reports
add column if not exists ai_summary_text text,
add column if not exists ai_issues text,
add column if not exists ai_recommendations text,
add column if not exists ai_health_status text,
add column if not exists ai_next_action text,
add column if not exists ai_model text,
add column if not exists ai_generated_at timestamptz,
add column if not exists ai_generation_error text;

create index if not exists stage_reports_ai_generated_at_idx
  on public.stage_reports (ai_generated_at desc);

