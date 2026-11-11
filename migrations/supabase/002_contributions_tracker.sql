-- Extend the existing recommendation bookmark table for the full contribution tracker.
-- Existing rows keep their current values; the columns are additive and safe to rerun.
alter table public.contributions
  add column if not exists title text not null default '';

alter table public.contributions
  add column if not exists pr_url text;
