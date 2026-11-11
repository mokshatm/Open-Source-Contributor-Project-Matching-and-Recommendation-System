import { supabase } from "@/services/supabaseClient";

export async function saveContribution({ githubUsername, issueUrl, repoName, notes }) {
    if (!supabase) return { success: false, error: new Error("Supabase is not configured.") };
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return { success: false, error: new Error("Sign in with GitHub to save contributions.") };
    const repository = String(repoName || "").startsWith("http") ? repoName : `https://github.com/${repoName || ""}`;
    const response = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ username: githubUsername, repository, issue_url: issueUrl, status: "Saved", notes: notes || "" }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, error: new Error(result.error || "Sign in with GitHub to save contributions.") };
    return { success: true, data: result.contribution };
}

function requireSupabase() {
    if (!supabase) throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    return supabase;
}

async function createOrUpdateContribution(payload, { preserveExisting = false } = {}) {
    const client = requireSupabase();
    const existingResult = await client.from("contributions").select("*")
        .eq("github_username", payload.github_username).eq("issue_url", payload.issue_url).limit(1);
    if (existingResult.error) throw existingResult.error;
    const existing = existingResult.data?.[0];
    if (existing && preserveExisting) return existing;
    const updatePayload = existing && !payload.notes && existing.notes
        ? { ...payload, notes: existing.notes }
        : payload;
    const result = existing
        ? await client.from("contributions").update(updatePayload).eq("id", existing.id).select("*")
        : await client.from("contributions").insert([payload]).select("*");
    if (result.error) throw result.error;
    if (result.data?.[0]) return result.data[0];

    // Some existing Supabase RLS policies permit INSERT but omit its RETURNING row.
    // Verify persistence by querying the exact unique username/issue pair before failing.
    const verification = await client.from("contributions").select("*")
        .eq("github_username", payload.github_username).eq("issue_url", payload.issue_url).limit(1);
    if (verification.error) throw verification.error;
    const verifiedRow = verification.data?.[0];
    if (verifiedRow && Object.entries(updatePayload).every(([key, value]) => verifiedRow[key] === value)) return verifiedRow;
    if (verifiedRow) throw new Error("Supabase found the contribution but did not apply the requested changes. Check the table update policy.");
    throw new Error("Supabase did not return or persist the saved contribution.");
}

export async function createTrackedContribution({ githubUsername, issueUrl, repoName, title, status, prUrl, notes }) {
    const payload = {
        github_username: githubUsername,
        issue_url: issueUrl,
        repo_name: repoName,
        status: String(status || "Saved").toLowerCase(),
        notes: notes || "",
    };
    if (title) payload.title = String(title).trim().slice(0, 300);
    // Keep old bookmark rows readable; the migration adds pr_url for explicit PR tracking.
    if (prUrl) payload.pr_url = prUrl;
    return createOrUpdateContribution(payload);
}

export async function updateTrackedContribution({ githubUsername, id, status, prUrl, notes, updatePrUrl = false }) {
    const client = requireSupabase();
    const payload = {
        status: String(status || "Saved").toLowerCase(),
        notes: notes || "",
    };
    if (updatePrUrl) payload.pr_url = prUrl || null;
    let result = await client.from("contributions").update(payload)
        .eq("github_username", githubUsername).eq("id", id).select("*");
    // Existing Supabase projects may not have the optional PR column until migration 002 is applied.
    // Empty PR fields do not block status/notes updates; non-empty PR URLs still require the migration.
    if (["PGRST204", "42703"].includes(result.error?.code) && updatePrUrl && !prUrl) {
        const legacyPayload = { status: payload.status, notes: payload.notes };
        result = await client.from("contributions").update(legacyPayload)
            .eq("github_username", githubUsername).eq("id", id).select("*");
    }
    if (result.error) throw result.error;
    if (result.data?.[0]) return result.data[0];
    const verification = await client.from("contributions").select("*")
        .eq("github_username", githubUsername).eq("id", id).limit(1);
    if (verification.error) throw verification.error;
    const updatedRow = verification.data?.[0];
    const persisted = updatedRow
        && updatedRow.status === payload.status
        && updatedRow.notes === payload.notes
        && (!updatePrUrl || (updatedRow.pr_url || null) === payload.pr_url);
    if (persisted) return updatedRow;
    if (updatedRow) throw new Error("Supabase did not apply the changes. Check the table update policy for this record.");
    throw new Error("Contribution not found for this GitHub username.");
}

export async function getContributionRecords(githubUsername) {
    if (!githubUsername) return [];
    const client = requireSupabase();
    const { data, error } = await client.from("contributions").select("*").eq("github_username", githubUsername);
    if (error) throw error;
    return data || [];
}

export async function deleteTrackedContribution(githubUsername, id) {
    const client = requireSupabase();
    const existing = await client.from("contributions").select("id")
        .eq("github_username", githubUsername).eq("id", id).limit(1);
    if (existing.error) throw existing.error;
    if (!existing.data?.length) throw new Error("Contribution not found for this GitHub username.");
    const { data, error } = await client.from("contributions").delete()
        .eq("github_username", githubUsername).eq("id", id).select("id");
    if (error) throw error;
    if (data?.length) return;
    const verification = await client.from("contributions").select("id")
        .eq("github_username", githubUsername).eq("id", id).limit(1);
    if (verification.error) throw verification.error;
    if (verification.data?.length) throw new Error("Supabase did not remove the contribution. Check the table delete policy.");
}

export async function getContributions(githubUsername) {
    if (!supabase || !githubUsername) return [];
    const { data, error } = await supabase.from("contributions")
        .select("*")
        .eq("github_username", githubUsername);
    if (error) {
        // A fresh Supabase project may not have the optional bookmark table yet.
        // Treat absent table/columns as an empty tracker; surface real transport failures.
        if (["42P01", "PGRST205"].includes(error.code)) return [];
        console.error("Error fetching contributions:", error);
        throw error;
    }
    return data || [];
}
