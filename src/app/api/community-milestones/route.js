import { NextResponse } from "next/server";
import { ensureContributionSchema } from "@/services/database";
import { normalizeOwnerUsername } from "@/services/contributionValidation";

const INTERACTION_TYPES = ["Discord / Matrix", "Mailing list", "Maintainer discussion", "Issue discussion", "Other"];
const fail = (message, status = 400) => Object.assign(new Error(message), { status });

function responseError(error, fallback) {
  const status = Number.isInteger(error?.status) ? error.status : 500;
  return NextResponse.json({ error: status === 500 ? fallback : error.message }, { status });
}

function requireText(value, field, max = 200) {
  const text = String(value || "").trim();
  if (!text || text.length > max) throw fail(`${field} is required and must be ${max} characters or fewer.`);
  return text;
}

function normalizeDate(value, field, optional = false) {
  if (!value && optional) return null;
  const date = String(value || "");
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw fail(`${field} must be a valid date.`);
  return date;
}

function normalizeWebLink(value, field) {
  let link;
  try { link = new URL(String(value || "")); } catch { throw fail(`${field} must be a valid HTTPS link.`); }
  if (link.protocol !== "https:") throw fail(`${field} must be a valid HTTPS link.`);
  return link.toString();
}

function serializeInteraction(row) {
  return { id: String(row.id), organization: row.organization, interactionType: row.interaction_type, link: row.interaction_link, date: row.interaction_date, notes: row.notes, createdAt: row.created_at };
}

function serializeMilestone(row, linkedContributions = []) {
  return { id: String(row.id), projectPhase: row.project_phase, title: row.title, startDate: row.start_date, endDate: row.end_date, notes: row.notes, sequenceOrder: row.sequence_order, linkedContributions };
}

export async function GET(request) {
  try {
    const owner = normalizeOwnerUsername(new URL(request.url).searchParams.get("username"));
    const pool = await ensureContributionSchema();
    const [interactionRows, milestoneRows, contributionRows, linkRows] = await Promise.all([
      pool.query("SELECT * FROM community_interactions WHERE owner_username = $1 ORDER BY interaction_date DESC, id DESC", [owner]),
      pool.query("SELECT * FROM project_milestones WHERE owner_username = $1 ORDER BY start_date NULLS LAST, sequence_order, id", [owner]),
      pool.query("SELECT id, repository_url, issue_url, status FROM contribution_issues WHERE owner_username = $1 ORDER BY updated_at DESC", [owner]),
      pool.query(`SELECT mc.milestone_id, c.id, c.repository_url, c.issue_url, c.status
        FROM milestone_contributions mc JOIN contribution_issues c
          ON c.id = mc.contribution_id AND c.owner_username = mc.owner_username
        WHERE mc.owner_username = $1`, [owner]),
    ]);
    const contributionsByMilestone = new Map();
    for (const row of linkRows.rows) {
      const key = String(row.milestone_id);
      const linked = contributionsByMilestone.get(key) || [];
      linked.push({ id: String(row.id), repositoryUrl: row.repository_url, issueUrl: row.issue_url, status: row.status });
      contributionsByMilestone.set(key, linked);
    }
    return NextResponse.json({
      interactions: interactionRows.rows.map(serializeInteraction),
      milestones: milestoneRows.rows.map((row) => serializeMilestone(row, contributionsByMilestone.get(String(row.id)) || [])),
      contributions: contributionRows.rows.map((row) => ({ id: String(row.id), repositoryUrl: row.repository_url, issueUrl: row.issue_url, status: row.status })),
    });
  } catch (error) { return responseError(error, "Unable to load community and milestone data from PostgreSQL."); }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const owner = normalizeOwnerUsername(body?.username);
    const pool = await ensureContributionSchema();
    if (body.kind === "interaction") {
      if (!INTERACTION_TYPES.includes(body.interactionType)) throw fail("Choose a supported interaction type.");
      const organization = String(body.organization || "").trim();
      if (organization.length > 120) throw fail("Organization name must be 120 characters or fewer.");
      const link = normalizeWebLink(body.link, "Interaction link");
      const date = normalizeDate(body.date, "Interaction date");
      const notes = String(body.notes || "");
      if (notes.length > 10000) throw fail("Notes must be 10,000 characters or fewer.");
      const result = await pool.query(`INSERT INTO community_interactions
        (owner_username, organization, interaction_type, interaction_link, interaction_date, notes)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [owner, organization, body.interactionType, link, date, notes]);
      return NextResponse.json({ interaction: serializeInteraction(result.rows[0]) }, { status: 201 });
    }
    if (body.kind === "milestone") {
      const phase = requireText(body.projectPhase, "Project phase", 120);
      const title = requireText(body.title, "Milestone title", 200);
      const startDate = normalizeDate(body.startDate, "Start date", true);
      const endDate = normalizeDate(body.endDate, "End date", true);
      if (startDate && endDate && endDate < startDate) throw fail("End date must be on or after the start date.");
      const notes = String(body.notes || "");
      if (notes.length > 10000) throw fail("Notes must be 10,000 characters or fewer.");
      const result = await pool.query(`INSERT INTO project_milestones
        (owner_username, project_phase, title, start_date, end_date, notes, sequence_order)
        VALUES ($1, $2, $3, $4, $5, $6, COALESCE((SELECT MAX(sequence_order) + 1 FROM project_milestones WHERE owner_username = $1), 0))
        RETURNING *`, [owner, phase, title, startDate, endDate, notes]);
      return NextResponse.json({ milestone: serializeMilestone(result.rows[0]) }, { status: 201 });
    }
    if (body.kind === "milestone-link") {
      const milestoneId = String(body.milestoneId || "");
      const contributionId = String(body.contributionId || "");
      if (!/^\d+$/.test(milestoneId) || !/^\d+$/.test(contributionId)) throw fail("Choose a milestone and a tracked issue.");
      const result = await pool.query(`INSERT INTO milestone_contributions (owner_username, milestone_id, contribution_id)
        SELECT $1, m.id, c.id FROM project_milestones m
        JOIN contribution_issues c ON c.owner_username = m.owner_username
        WHERE m.owner_username = $1 AND m.id = $2 AND c.id = $3 AND c.status IN ('Saved', 'Merged')
        ON CONFLICT DO NOTHING RETURNING milestone_id`, [owner, milestoneId, contributionId]);
      if (!result.rowCount) throw fail("Select an existing milestone and a Saved or Merged issue.", 404);
      return NextResponse.json({ linked: true }, { status: 201 });
    }
    throw fail("Choose a supported community or milestone action.");
  } catch (error) { return responseError(error, "Unable to save community or milestone data."); }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const owner = normalizeOwnerUsername(body?.username);
    const id = String(body?.id || "");
    if (!/^\d+$/.test(id)) throw fail("A valid record ID is required.");
    const pool = await ensureContributionSchema();
    if (body.kind === "interaction") {
      const notes = String(body.notes || "");
      if (notes.length > 10000) throw fail("Notes must be 10,000 characters or fewer.");
      const result = await pool.query(`UPDATE community_interactions SET notes = $1, updated_at = NOW()
        WHERE owner_username = $2 AND id = $3 RETURNING *`, [notes, owner, id]);
      if (!result.rowCount) throw fail("Interaction not found.", 404);
      return NextResponse.json({ interaction: serializeInteraction(result.rows[0]) });
    }
    if (body.kind === "milestone") {
      const phase = requireText(body.projectPhase, "Project phase", 120);
      const title = requireText(body.title, "Milestone title", 200);
      const startDate = normalizeDate(body.startDate, "Start date", true);
      const endDate = normalizeDate(body.endDate, "End date", true);
      if (startDate && endDate && endDate < startDate) throw fail("End date must be on or after the start date.");
      const notes = String(body.notes || "");
      if (notes.length > 10000) throw fail("Notes must be 10,000 characters or fewer.");
      const result = await pool.query(`UPDATE project_milestones SET project_phase = $1, title = $2, start_date = $3,
        end_date = $4, notes = $5, updated_at = NOW() WHERE owner_username = $6 AND id = $7 RETURNING *`,
      [phase, title, startDate, endDate, notes, owner, id]);
      if (!result.rowCount) throw fail("Milestone not found.", 404);
      return NextResponse.json({ milestone: serializeMilestone(result.rows[0]) });
    }
    throw fail("Choose a supported record type.");
  } catch (error) { return responseError(error, "Unable to update the community or milestone record."); }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const owner = normalizeOwnerUsername(url.searchParams.get("username"));
    const kind = url.searchParams.get("kind");
    const id = url.searchParams.get("id") || "";
    const pool = await ensureContributionSchema();
    if (kind === "milestone-link") {
      const contributionId = url.searchParams.get("contributionId") || "";
      if (!/^\d+$/.test(id) || !/^\d+$/.test(contributionId)) throw fail("Choose a valid milestone issue link.");
      await pool.query("DELETE FROM milestone_contributions WHERE owner_username = $1 AND milestone_id = $2 AND contribution_id = $3", [owner, id, contributionId]);
      return NextResponse.json({ deleted: true });
    }
    if (!/^\d+$/.test(id)) throw fail("A valid record ID is required.");
    const table = kind === "interaction" ? "community_interactions" : kind === "milestone" ? "project_milestones" : null;
    if (!table) throw fail("Choose a supported record type.");
    const result = await pool.query(`DELETE FROM ${table} WHERE owner_username = $1 AND id = $2`, [owner, id]);
    if (!result.rowCount) throw fail("Record not found.", 404);
    return NextResponse.json({ deleted: true });
  } catch (error) { return responseError(error, "Unable to delete the community or milestone record."); }
}
