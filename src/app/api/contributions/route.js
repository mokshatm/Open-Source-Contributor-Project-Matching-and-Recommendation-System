import { NextResponse } from "next/server";
import { authorizeContributionRequest } from "@/services/supabaseContributionAuth";
import { validateContributionRecord, validateManualContributionPayload } from "@/services/contributionValidation";

function serialize(row) {
  const storedRepository = String(row.repository_url || row.repo_name || "").trim();
  const repositoryUrl = storedRepository.startsWith("http") ? storedRepository : `https://github.com/${storedRepository.replace(/^\/+/, "")}`;
  const status = String(row.status || "saved").trim().toLowerCase();
  const displayStatus = { saved: "Saved", "in progress": "In Progress", "pr submitted": "PR Submitted", merged: "Merged" }[status] || row.status;
  return {
    id: String(row.id), userId: row.user_id, ownerUsername: row.github_username,
    repositoryUrl, repo_name: row.repo_name || repositoryUrl.replace("https://github.com/", ""),
    issueUrl: row.issue_url, issue_url: row.issue_url, title: row.title || "", status: displayStatus,
    prUrl: row.pr_url || "", pr_url: row.pr_url || "", personalNotes: row.notes || "", notes: row.notes || "",
    createdAt: row.created_at || null, updatedAt: row.updated_at || null,
  };
}

function rowPayload(record, user, githubUsername) {
  return {
    user_id: user.id,
    github_username: githubUsername,
    title: record.title || "",
    repository_url: record.repositoryUrl,
    repo_name: record.repoName,
    issue_url: record.issueUrl,
    status: String(record.status || "Saved").toLowerCase(),
    pr_url: record.prUrl || null,
    notes: record.personalNotes || "",
  };
}

export async function GET(request) {
  try {
    const { client, user } = await authorizeContributionRequest(request);
    const { data, error } = await client.from("user_contributions").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ contributions: (data || []).map(serialize) });
  } catch (error) {
    console.error("Failed to load contribution records:", error);
    return NextResponse.json({ error: error.status === 401 ? error.message : "Contribution records could not be loaded. Apply migrations/supabase/003_user_contributions.sql and check Supabase access.", contributions: [] }, { status: error.status || 503 });
  }
}

export async function POST(request) {
  try {
    const { client, user, githubUsername } = await authorizeContributionRequest(request);
    const body = await request.json();
    const record = validateManualContributionPayload(body);
    const { data, error } = await client.from("user_contributions")
      .upsert([rowPayload(record, user, githubUsername)], { onConflict: "user_id,issue_url" }).select("*");
    if (error) throw error;
    if (!data?.[0]) throw new Error("Supabase did not return the saved contribution.");
    return NextResponse.json({ contribution: serialize(data[0]) }, { status: 201 });
  } catch (error) {
    console.error("Failed to save contribution:", error);
    return NextResponse.json({ error: error.status === 401 ? error.message : error.status === 400 ? error.message : "Could not save contribution. Check the Supabase migration and row-level security policies.", contribution: null }, { status: error.status || 503 });
  }
}

export async function PUT(request) {
  try {
    const { client, user } = await authorizeContributionRequest(request);
    const body = await request.json();
    const id = String(body.id || "");
    if (!id || id.length > 80) return NextResponse.json({ error: "A valid contribution ID is required." }, { status: 400 });
    const fields = validateContributionRecord(body, { partial: true });
    if (!Object.keys(fields).length) return NextResponse.json({ error: "There are no contribution changes to save." }, { status: 400 });
    const payload = {};
    if (fields.status !== undefined) payload.status = fields.status.toLowerCase();
    if (fields.prUrl !== undefined) payload.pr_url = fields.prUrl;
    if (fields.personalNotes !== undefined) payload.notes = fields.personalNotes;
    if (fields.repositoryUrl !== undefined) {
      payload.repository_url = fields.repositoryUrl;
      const path = new URL(fields.repositoryUrl).pathname.split("/").filter(Boolean);
      payload.repo_name = `${path[0]}/${path[1]}`;
    }
    if (fields.issueUrl !== undefined) payload.issue_url = fields.issueUrl;
    payload.updated_at = new Date().toISOString();
    const { data, error } = await client.from("user_contributions").update(payload)
      .eq("user_id", user.id).eq("id", id).select("*");
    if (error) throw error;
    if (!data?.[0]) return NextResponse.json({ error: "Contribution not found or not owned by this account." }, { status: 404 });
    return NextResponse.json({ contribution: serialize(data[0]) });
  } catch (error) {
    console.error("Failed to update contribution:", error);
    return NextResponse.json({ error: error.status === 401 ? error.message : error.status === 400 ? error.message : "Could not update contribution. Check the Supabase migration and row-level security policies." }, { status: error.status || 503 });
  }
}

export async function DELETE(request) {
  try {
    const { client, user } = await authorizeContributionRequest(request);
    const url = new URL(request.url);
    const id = url.searchParams.get("id") || "";
    if (!id || id.length > 80) return NextResponse.json({ error: "A valid contribution ID is required." }, { status: 400 });
    const { data, error } = await client.from("user_contributions").delete().eq("user_id", user.id).eq("id", id).select("id");
    if (error) throw error;
    if (!data?.length) return NextResponse.json({ error: "Contribution not found or not owned by this account." }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Failed to delete contribution:", error);
    return NextResponse.json({ error: error.status === 401 ? error.message : "Could not delete contribution. Check the Supabase migration and row-level security policies." }, { status: error.status || 503 });
  }
}
