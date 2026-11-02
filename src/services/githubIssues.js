import "server-only";
import { githubRequest, assertGitHubToken, GitHubApiError } from "@/services/github";

export const TRACKED_REPOSITORIES = [
  "psf/requests", "pallets/flask", "fastapi/fastapi", "pytest-dev/pytest", "django/django",
  "expressjs/express", "facebook/react", "vuejs/vue", "tailwindlabs/tailwindcss", "vercel/next.js",
  "rust-lang/rust", "golang/go", "spring-projects/spring-boot", "torvalds/linux", "rails/rails",
];

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
  for (let page = 1; page <= maxPages; page += 1) {
    const response = await githubRequest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/issues?state=open&per_page=${perPage}&page=${page}&sort=updated&direction=desc`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new GitHubApiError(`GitHub returned an unexpected issue response for ${fullName}.`, 502);
    for (const issue of data) {
      if (!issue.pull_request && issue.title?.trim()) issues.push(normalizeIssue(issue, repo));
    }
    if (data.length < perPage) break;
  }
  return issues;
}

let issuesCache = null;
let issuesCacheExpires = 0;
let issuesInFlight = null;

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
  if (!forceRefresh && issuesCache && Date.now() < issuesCacheExpires) return issuesCache;
  if (!forceRefresh && issuesInFlight) return issuesInFlight;
  issuesInFlight = collectFresh({ repos, perPage, maxPages, concurrency });
  try {
    const result = await issuesInFlight;
    issuesCache = result;
    issuesCacheExpires = Date.now() + 60_000;
    return result;
  } finally {
    issuesInFlight = null;
  }
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

