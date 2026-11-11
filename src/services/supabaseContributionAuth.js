import "server-only";
import { createClient } from "@supabase/supabase-js";

export async function authorizeContributionRequest(request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw Object.assign(new Error("Sign in with GitHub to access contributions."), { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error("Supabase is not configured for contribution storage.");

  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw Object.assign(new Error("Your GitHub session is invalid or expired. Sign in again."), { status: 401 });

  const metadata = data.user.user_metadata || {};
  const githubUsername = metadata.user_name || metadata.preferred_username || metadata.username || null;
  return { client, user: data.user, githubUsername };
}
