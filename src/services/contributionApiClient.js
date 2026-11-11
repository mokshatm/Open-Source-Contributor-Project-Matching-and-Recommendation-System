"use client";

import { supabase } from "@/services/supabaseClient";
import { validateManualContributionPayload } from "@/services/contributionValidation";

export async function getContributionSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session || null;
}

export async function requestContributionApi(path, options = {}) {
  const session = await getContributionSession();
  if (!session?.access_token) {
    const error = new Error("No Supabase session is active; the contribution is being handled locally.");
    throw error;
  }
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${session.access_token}`);
  if (options.body) headers.set("Content-Type", "application/json");
  const response = await fetch(path, { ...options, headers, cache: "no-store" });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || "Contribution request failed.");
    error.status = response.status;
    throw error;
  }
  return result;
}

function getLocalUsername() {
  try {
    const profile = JSON.parse(localStorage.getItem("developerEligibilityProfile") || "null");
    return String(profile?.username || "").trim().replace(/^@/, "").toLowerCase();
  } catch {
    return "";
  }
}

function localStorageKey(username = getLocalUsername()) {
  return username ? `osMatcherContributions:${username}` : "";
}

function readLocalContributions(username = getLocalUsername()) {
  const key = localStorageKey(username);
  if (!key) return [];
  try {
    const rows = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function writeLocalContributions(rows, username = getLocalUsername()) {
  const key = localStorageKey(username);
  if (!key) throw new Error("Set up a GitHub username in your developer profile before tracking contributions.");
  localStorage.setItem(key, JSON.stringify(rows));
}

function toLocalContribution(payload, username, previous = null) {
  const record = validateManualContributionPayload({ ...payload, username });
  const now = new Date().toISOString();
  const id = previous?.id || `local-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
  return {
    id,
    userId: null,
    ownerUsername: username,
    repositoryUrl: record.repositoryUrl,
    repo_name: record.repoName,
    issueUrl: record.issueUrl,
    issue_url: record.issueUrl,
    title: record.title || previous?.title || "",
    status: record.status,
    prUrl: record.prUrl || "",
    pr_url: record.prUrl || "",
    personalNotes: record.personalNotes || "",
    notes: record.personalNotes || "",
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  };
}

async function listRemoteOrLocal() {
  const localRows = readLocalContributions();
  try {
    const result = await requestContributionApi("/api/contributions");
    const remoteRows = result.contributions || [];
    const seen = new Set(remoteRows.map((row) => row.issueUrl));
    const merged = [...remoteRows, ...localRows.filter((row) => !seen.has(row.issueUrl))];
    writeLocalContributions(merged);
    return merged;
  } catch {
    return localRows;
  }
}

export async function listContributions() {
  return listRemoteOrLocal();
}

export async function createContribution(payload) {
  const username = getLocalUsername();
  if (!username) throw new Error("Set up a GitHub username in your developer profile before tracking contributions.");
  const localRow = toLocalContribution(payload, username);
  const current = readLocalContributions(username);
  const previous = current.find((row) => row.issueUrl === localRow.issueUrl);
  const nextLocalRow = previous ? toLocalContribution({ ...localRow, ...payload }, username, previous) : localRow;
  writeLocalContributions([nextLocalRow, ...current.filter((row) => row.issueUrl !== localRow.issueUrl)], username);

  try {
    const result = await requestContributionApi("/api/contributions", { method: "POST", body: JSON.stringify(payload) });
    const saved = result.contribution;
    writeLocalContributions([saved, ...readLocalContributions(username).filter((row) => row.issueUrl !== saved.issueUrl)], username);
    return saved;
  } catch {
    return nextLocalRow;
  }
}

export async function putContribution(payload) {
  const username = getLocalUsername();
  const current = readLocalContributions(username);
  const previous = current.find((row) => String(row.id) === String(payload.id));
  const localRow = previous ? toLocalContribution({
    repository: payload.repositoryUrl || previous.repositoryUrl,
    issue_url: payload.issueUrl || previous.issueUrl,
    title: payload.title ?? previous.title,
    status: payload.status ?? previous.status,
    pr_url: payload.prUrl ?? previous.prUrl,
    notes: payload.personalNotes ?? previous.personalNotes,
  }, username, previous) : null;
  if (localRow) writeLocalContributions(current.map((row) => String(row.id) === String(payload.id) ? localRow : row), username);
  try {
    const result = await requestContributionApi("/api/contributions", { method: "PUT", body: JSON.stringify(payload) });
    const saved = result.contribution;
    writeLocalContributions([saved, ...readLocalContributions(username).filter((row) => row.issueUrl !== saved.issueUrl)], username);
    return saved;
  } catch (error) {
    if (localRow) return localRow;
    throw error;
  }
}

export async function removeContribution(id) {
  const username = getLocalUsername();
  const current = readLocalContributions(username);
  const remaining = current.filter((row) => String(row.id) !== String(id));
  writeLocalContributions(remaining, username);
  try {
    const result = await requestContributionApi(`/api/contributions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    return result.deleted;
  } catch {
    return true;
  }
}
