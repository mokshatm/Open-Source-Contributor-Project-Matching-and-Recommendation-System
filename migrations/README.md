# Supabase schema

Apply the scripts in `migrations/supabase` in numeric order using the Supabase SQL editor. Contribution records use `user_contributions`, Supabase GitHub Auth, and row-level security tied to `auth.uid()`.

Enable GitHub as an Auth provider in the Supabase dashboard and add the local and production application URLs to Supabase Auth's redirect allow list. The client uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; no service-role key is needed or exposed. Users must sign in with GitHub before saving or editing private contribution records.

The legacy `contributions` table is still used by older installs and recommendation bookmarks created before authenticated tracking. Records in that table are not automatically assigned to Auth users, because a stored GitHub username alone does not prove ownership.
