import "server-only";
import { githubRequest, assertGitHubToken, fetchGitHubOrganizationRepositories, GitHubApiError } from "@/services/github";

export const TRACKED_REPOSITORIES = [
  "psf/requests", "pallets/flask", "fastapi/fastapi", "pytest-dev/pytest", "django/django",
  "expressjs/express", "facebook/react", "vuejs/vue", "tailwindlabs/tailwindcss", "vercel/next.js",
  "rust-lang/rust", "golang/go", "spring-projects/spring-boot", "torvalds/linux", "rails/rails",
];

export const ACTIVE_ISSUE_MAX_AGE_DAYS = 365;

export function isFreshOpenIssue(issue, now = Date.now()) {
  if (String(issue?.state || "").toLowerCase() !== "open" || issue?.pull_request) return false;
  const updatedAt = Date.parse(issue?.updated_at || issue?.updatedAt || "");
  if (!Number.isFinite(updatedAt)) return false;
  return now - updatedAt <= ACTIVE_ISSUE_MAX_AGE_DAYS * 86_400_000;
}

function normalizeIssue(raw, repo) {
  return {
    id: raw.id, number: raw.number, nodeId: raw.node_id, title: raw.title,
    body: raw.body || "", url: raw.html_url, repoFullName: repo.fullName,
    repoName: repo.name, repoUrl: repo.htmlUrl, repoStars: repo.stars,
    repoLanguage: repo.language, repoTopics: repo.topics,
    labels: (raw.labels || []).map((label) => ({ name: label.name, color: label.color, description: label.description || "" })),
    createdAt: raw.created_at, updatedAt: raw.updated_at, commentsCount: raw.comments ?? 0,
    assignees: (raw.assignees || []).map((a) => ({ login: a.login, avatarUrl: a.avatar_url, profileUrl: a.html_url })),
    state: raw.state, isPullRequest: Boolean(raw.pull_request),
  };
}

async function fetchRepoIssues(fullName, repo, perPage, maxPages) {
  const [owner, name] = fullName.split("/");
  const issues = [];
  const now = Date.now();
  for (let page = 1; page <= maxPages; page += 1) {
    const response = await githubRequest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/issues?state=open&per_page=${perPage}&page=${page}&sort=updated&direction=desc`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new GitHubApiError(`GitHub returned an unexpected issue response for ${fullName}.`, 502);
    for (const issue of data) {
      if (isFreshOpenIssue(issue, now) && issue.title?.trim()) issues.push(normalizeIssue(issue, repo));
    }
    const lastUpdatedAt = Date.parse(data.at(-1)?.updated_at || "");
    if (Number.isFinite(lastUpdatedAt) && now - lastUpdatedAt > ACTIVE_ISSUE_MAX_AGE_DAYS * 86_400_000) break;
    if (data.length < perPage) break;
  }
  return issues;
}

const issuesCache = new Map();
const issuesInFlight = new Map();

async function collectFresh({ repos, perPage, maxPages, concurrency }) {
  const allIssues = [];
  const errors = [];
  let rateLimitHit = false;
  const seen = new Set();
  for (let i = 0; i < repos.length; i += concurrency) {
    const batch = repos.slice(i, i + concurrency);
    const results = await Promise.all(batch.map(async (fullName) => {
      const [owner, name] = fullName.split("/");
      const metaPromise = githubRequest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`).then((r) => r.json());
      const [metaResult, issueResult] = await Promise.allSettled([
        metaPromise,
        fetchRepoIssues(fullName, { fullName, name, htmlUrl: `https://github.com/${fullName}`, stars: null, language: null, topics: [] }, perPage, maxPages),
      ]);
      if (metaResult.status === "rejected") errors.push(`${fullName} metadata: ${metaResult.reason.message || "request failed"}`);
      if (issueResult.status === "rejected") {
        errors.push(`${fullName} issues: ${issueResult.reason.message || "request failed"}`);
        if (issueResult.reason.rateLimited) rateLimitHit = true;
        return [];
      }
      const meta = metaResult.status === "fulfilled" ? metaResult.value : {};
      const repo = {
        fullName: meta.full_name || fullName, name: meta.name || name,
        htmlUrl: meta.html_url || `https://github.com/${fullName}`,
        stars: meta.stargazers_count ?? null, language: meta.language || null, topics: meta.topics || [],
      };
      return issueResult.value.map((issue) => ({ ...issue, repoFullName: repo.fullName, repoName: repo.name, repoUrl: repo.htmlUrl, repoStars: repo.stars, repoLanguage: repo.language, repoTopics: repo.topics }));
    }));
    for (const issues of results) for (const issue of issues) {
      if (!seen.has(issue.id)) { seen.add(issue.id); allIssues.push(issue); }
    }
    if (rateLimitHit) break;
  }
  allIssues.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return { issues: allIssues, errors, rateLimitHit };
}

export async function collectGitHubIssues({ repos = TRACKED_REPOSITORIES, perPage = 100, maxPages = 2, concurrency = 4, forceRefresh = false } = {}) {
  assertGitHubToken();
  const cacheKey = JSON.stringify({ repos: [...new Set(repos)].sort(), perPage, maxPages, concurrency });
  const cached = issuesCache.get(cacheKey);
  if (!forceRefresh && cached && Date.now() < cached.expiresAt) return cached.result;
  if (!forceRefresh && issuesInFlight.has(cacheKey)) return issuesInFlight.get(cacheKey);
  const request = collectFresh({ repos, perPage, maxPages, concurrency });
  issuesInFlight.set(cacheKey, request);
  try {
    const result = await request;
    issuesCache.set(cacheKey, { result, expiresAt: Date.now() + 60_000 });
    if (issuesCache.size > 30) issuesCache.delete(issuesCache.keys().next().value);
    return result;
  } finally {
    if (issuesInFlight.get(cacheKey) === request) issuesInFlight.delete(cacheKey);
  }
}

export async function collectOrganizationGitHubIssues(organizations = [], options = {}) {
  const orgs = [...new Set(organizations.map((value) => String(value || "").trim()).filter(Boolean))];
  if (!orgs.length) throw new GitHubApiError("Add at least one target GitHub organization.", 400);
  if (orgs.length > 20) throw new GitHubApiError("Target at most 20 GitHub organizations at a time.", 400);
  const resolved = await Promise.allSettled(orgs.map(async (organization) => ({ organization, ...(await fetchGitHubOrganizationRepositories(organization)) })));
  const repositoryGroups = [];
  const errors = [];
  let truncatedOrganizations = 0;
  for (let index = 0; index < resolved.length; index += 1) {
    const result = resolved[index];
    if (result.status === "rejected") {
      errors.push(`${orgs[index]} organization: ${result.reason?.message || "Unable to list organization repositories."}`);
      continue;
    }
    repositoryGroups.push({ organization: orgs[index], repositories: result.value.repositories, truncated: result.value.truncated });
  }
  const uniqueRepositories = [];
  const uniqueSet = new Set();
  const cursors = repositoryGroups.map(() => 0);
  while (uniqueRepositories.length < 50) {
    let added = false;
    for (let index = 0; index < repositoryGroups.length && uniqueRepositories.length < 50; index += 1) {
      const group = repositoryGroups[index];
      const candidate = group.repositories[cursors[index]++];
      if (candidate) {
        added = true;
        if (!uniqueSet.has(candidate)) { uniqueSet.add(candidate); uniqueRepositories.push(candidate); }
      }
    }
    if (!added) break;
  }
  for (let index = 0; index < repositoryGroups.length; index += 1) {
    if (repositoryGroups[index].truncated || cursors[index] < repositoryGroups[index].repositories.length) truncatedOrganizations += 1;
  }
  const collected = uniqueRepositories.length
    ? await collectGitHubIssues({ ...options, repos: uniqueRepositories })
    : { issues: [], errors: [], rateLimitHit: false };
  return {
    ...collected,
    errors: [...errors, ...collected.errors],
    warnings: truncatedOrganizations ? [`Repository collection is capped to 50 recently updated repositories across the selected organizations (${truncatedOrganizations} organization list(s) truncated).`] : [],
    trackedRepositories: uniqueRepositories.length,
    targetOrganizations: orgs,
    truncatedOrganizations,
  };
}

export function deriveFilterOptions(issues) {
  const languages = new Set(); const labelNames = new Set(); const repoNames = new Set();
  for (const issue of issues) {
    if (issue.repoLanguage) languages.add(issue.repoLanguage);
    for (const label of issue.labels) labelNames.add(label.name);
    if (issue.repoFullName) repoNames.add(issue.repoFullName);
  }
  return { languages: [...languages].sort(), labelNames: [...labelNames].sort(), repoNames: [...repoNames].sort() };
}

export function inferDifficulty(labels) {
  const names = labels.map((label) => label.name.toLowerCase());
  if (["good first issue", "beginner", "starter", "easy", "first-timers-only", "help wanted", "newcomer", "good-first-issue"].some((k) => names.some((n) => n.includes(k)))) return "Beginner";
  if (["intermediate", "medium", "moderate"].some((k) => names.some((n) => n.includes(k)))) return "Intermediate";
  if (["advanced", "hard", "complex", "expert", "senior"].some((k) => names.some((n) => n.includes(k)))) return "Advanced";
  return null;
}

