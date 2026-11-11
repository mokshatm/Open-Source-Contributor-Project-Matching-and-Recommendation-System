-- Supabase community and milestone tables.
-- Apply this in the Supabase SQL editor before using the Community & Milestones page.
create table if not exists public.community_interactions (
  id uuid primary key default gen_random_uuid(),
  github_username text not null,
  organization text not null default '',
  interaction_type text not null,
  interaction_link text not null,
  interaction_date date not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists community_interactions_user_date_idx
  on public.community_interactions (github_username, interaction_date desc);

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  github_username text not null,
  project_phase text not null,
  title text not null,
  start_date date,
  end_date date,
  notes text not null default '',
  sequence_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists project_milestones_user_timeline_idx
  on public.project_milestones (github_username, start_date, sequence_order);

create table if not exists public.milestone_contributions (
  github_username text not null,
  milestone_id uuid not null references public.project_milestones(id) on delete cascade,
  issue_url text not null,
  created_at timestamptz not null default now(),
  primary key (github_username, milestone_id, issue_url)
);
