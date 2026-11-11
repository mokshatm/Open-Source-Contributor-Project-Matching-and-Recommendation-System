-- User-owned contribution tracker. GitHub OAuth is required by the API;
-- RLS binds every row to the verified Supabase auth user.
create table if not exists public.user_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  github_username text,
  title text not null default '',
  repository_url text not null,
  repo_name text not null,
  issue_url text not null,
  status text not null default 'saved'
    check (status in ('saved', 'in progress', 'pr submitted', 'merged')),
  pr_url text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_contributions_user_issue_unique unique (user_id, issue_url)
);

create index if not exists user_contributions_user_updated_idx
  on public.user_contributions (user_id, updated_at desc);

alter table public.user_contributions enable row level security;

drop policy if exists "Users can read their contributions" on public.user_contributions;
create policy "Users can read their contributions"
  on public.user_contributions for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can add their contributions" on public.user_contributions;
create policy "Users can add their contributions"
  on public.user_contributions for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can edit their contributions" on public.user_contributions;
create policy "Users can edit their contributions"
  on public.user_contributions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete their contributions" on public.user_contributions;
create policy "Users can delete their contributions"
  on public.user_contributions for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.user_contributions to authenticated;
