import { supabase } from "@/services/supabaseClient";
import { listContributions } from "@/services/contributionApiClient";

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  return supabase;
}

function throwIfError(error) {
  if (error) throw new Error(error.message || "Supabase request failed.");
}

function firstRow(data, action) {
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) throw new Error(`Supabase did not return a row after ${action}.`);
  return row;
}

function serializeInteraction(row) {
  return {
    id: String(row.id),
    organization: row.organization || "",
    interactionType: row.interaction_type,
    link: row.interaction_link,
    date: row.interaction_date,
    notes: row.notes || "",
    createdAt: row.created_at,
  };
}

function serializeMilestone(row, linkedContributions = []) {
  return {
    id: String(row.id),
    projectPhase: row.project_phase,
    title: row.title,
    startDate: row.start_date || "",
    endDate: row.end_date || "",
    notes: row.notes || "",
    sequenceOrder: row.sequence_order || 0,
    linkedContributions,
  };
}

export async function getCommunityMilestoneData(githubUsername) {
  const client = requireSupabase();
  const [interactionResult, milestoneResult, linkResult, contributions] = await Promise.all([
    client.from("community_interactions").select("*").eq("github_username", githubUsername).order("interaction_date", { ascending: false }).order("id", { ascending: false }),
    client.from("project_milestones").select("*").eq("github_username", githubUsername).order("start_date", { ascending: true }).order("sequence_order", { ascending: true }),
    client.from("milestone_contributions").select("*").eq("github_username", githubUsername),
    listContributions(),
  ]);
  throwIfError(interactionResult.error);
  throwIfError(milestoneResult.error);
  throwIfError(linkResult.error);

  const contributionsByUrl = new Map(contributions.map((item) => [
    item.issue_url,
    { id: String(item.id), issueUrl: item.issue_url, repositoryUrl: item.repo_name, status: item.status },
  ]));
  const linkedByMilestone = new Map();
  for (const link of linkResult.data || []) {
    const item = contributionsByUrl.get(link.issue_url) || { id: link.issue_url, issueUrl: link.issue_url, status: "Saved" };
    const linked = linkedByMilestone.get(String(link.milestone_id)) || [];
    linked.push(item);
    linkedByMilestone.set(String(link.milestone_id), linked);
  }

  return {
    interactions: (interactionResult.data || []).map(serializeInteraction),
    milestones: (milestoneResult.data || []).map((row) => serializeMilestone(row, linkedByMilestone.get(String(row.id)) || [])),
    contributions: contributions.map((item) => ({
      id: String(item.id),
      repositoryUrl: item.repo_name,
      issueUrl: item.issue_url,
      status: item.status,
    })),
  };
}

export async function createCommunityInteraction(githubUsername, interaction) {
  const client = requireSupabase();
  const { data, error } = await client.from("community_interactions").insert([{
    github_username: githubUsername,
    organization: interaction.organization || "",
    interaction_type: interaction.interactionType,
    interaction_link: interaction.link,
    interaction_date: interaction.date,
    notes: interaction.notes || "",
  }]).select("*");
  throwIfError(error);
  return serializeInteraction(firstRow(data, "creating the interaction"));
}

export async function createProjectMilestone(githubUsername, milestone) {
  const client = requireSupabase();
  const sequenceResult = await client.from("project_milestones").select("sequence_order").eq("github_username", githubUsername).order("sequence_order", { ascending: false }).limit(1);
  throwIfError(sequenceResult.error);
  const sequenceOrder = (sequenceResult.data?.[0]?.sequence_order ?? -1) + 1;
  const { data, error } = await client.from("project_milestones").insert([{
    github_username: githubUsername,
    project_phase: milestone.projectPhase,
    title: milestone.title,
    start_date: milestone.startDate || null,
    end_date: milestone.endDate || null,
    notes: milestone.notes || "",
    sequence_order: sequenceOrder,
  }]).select("*");
  throwIfError(error);
  return serializeMilestone(firstRow(data, "creating the milestone"));
}

export async function updateCommunityInteraction(githubUsername, interaction) {
  const client = requireSupabase();
  const payload = {
    organization: interaction.organization || "",
    interaction_type: interaction.interactionType,
    interaction_link: interaction.link,
    interaction_date: interaction.date,
    notes: interaction.notes || "",
  };
  console.debug("[communityMilestoneService] updateCommunityInteraction", { id: interaction.id, payload });
  const { data, error } = await client.from("community_interactions").update(payload)
    .eq("github_username", githubUsername).eq("id", interaction.id).select("*");
  throwIfError(error);
  const updatedRow = data?.[0];
  if (!updatedRow) throw new Error("Supabase did not return a row after updating the community interaction.");
  return serializeInteraction(updatedRow);
}

export async function updateCommunityInteractionNotes(githubUsername, interaction) {
  return updateCommunityInteraction(githubUsername, interaction);
}

export async function updateProjectMilestone(githubUsername, milestone) {
  const client = requireSupabase();
  const payload = {
    project_phase: milestone.projectPhase,
    title: milestone.title,
    start_date: milestone.startDate || null,
    end_date: milestone.endDate || null,
    notes: milestone.notes || "",
  };
  console.debug("[communityMilestoneService] updateProjectMilestone", { id: milestone.id, payload });
  const { data, error } = await client.from("project_milestones").update(payload)
    .eq("github_username", githubUsername).eq("id", milestone.id).select("*");
  throwIfError(error);
  const updatedRow = data?.[0];
  if (!updatedRow) throw new Error("Supabase did not return a row after updating the milestone.");
  return serializeMilestone(updatedRow, milestone.linkedContributions || []);
}

export async function deleteCommunityItem(githubUsername, kind, id) {
  const client = requireSupabase();
  const table = kind === "interaction" ? "community_interactions" : "project_milestones";
  const { error } = await client.from(table).delete().eq("github_username", githubUsername).eq("id", id);
  throwIfError(error);
}

export async function linkContributionToMilestone(githubUsername, milestoneId, issueUrl) {
  const client = requireSupabase();
  const { data, error } = await client.from("milestone_contributions").insert([{
    github_username: githubUsername,
    milestone_id: milestoneId,
    issue_url: issueUrl,
  }]).select("*");
  throwIfError(error);
  return firstRow(data, "linking the contribution to a milestone");
}

export async function unlinkContributionFromMilestone(githubUsername, milestoneId, issueUrl) {
  const client = requireSupabase();
  const { error } = await client.from("milestone_contributions").delete()
    .eq("github_username", githubUsername).eq("milestone_id", milestoneId).eq("issue_url", issueUrl);
  throwIfError(error);
}
