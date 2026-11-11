import "server-only";

const API = "https://api.github.com";

export class GitHubApiError extends Error {
  constructor(message, status, resetAt = null) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
    this.resetAt = resetAt;
    this.rateLimited = status === 403 || status === 429;
  }
}

export function assertGitHubToken() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new GitHubApiError("Server GitHub token is not configured. Set GITHUB_TOKEN and restart the app.", 500);
  return token;
}

export async function githubRequest(pathOrUrl) {
  const token = assertGitHubToken();
  let response;
  try {
    response = await fetch(pathOrUrl.startsWith("https://") ? pathOrUrl : `${API}${pathOrUrl}`, {
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" },
      cache: "no-store",
    });
  } catch {
    throw new GitHubApiError("Network connection error. Unable to reach GitHub API.", 502);
  }
  if (!response.ok) {
    const reset = response.headers.get("x-ratelimit-reset");
    const resetAt = reset ? new Date(Number(reset) * 1000).toISOString() : null;
    const message = response.status === 401
      ? "GitHub rejected the server token. Check that GITHUB_TOKEN is valid and restart the app."
      : response.status === 404
        ? "The requested GitHub resource was not found."
        : response.status === 403 || response.status === 429
          ? `GitHub API rate limit or access restriction reached${resetAt ? `. Retry after ${resetAt}` : "."}`
          : `GitHub API responded with status ${response.status}.`;
    throw new GitHubApiError(message, response.status, resetAt);
  }
  return response;
}

async function fetchPages(path, maxPages = 5) {
  const items = [];
  let next = path;
  let pageCount = 0;
  while (next && pageCount < maxPages) {
    const response = await githubRequest(next);
    const page = await response.json();
    if (!Array.isArray(page)) throw new GitHubApiError("GitHub returned an unexpected repository response.", 502);
    items.push(...page);
    pageCount += 1;
    const link = response.headers.get("link") || "";
    next = link.split(",").map((part) => part.trim()).find((part) => part.endsWith('rel="next"'))?.match(/<([^>]+)>/)?.[1] || null;
  }
  return { items, truncated: Boolean(next) };
}

export async function fetchGitHubProfile(username) {
  const cleanUsername = username.trim();
  if (!cleanUsername || !/^[a-zA-Z0-9-]{1,39}$/.test(cleanUsername)) throw new GitHubApiError("Please enter a valid GitHub username.", 400);
  const userResponse = await githubRequest(`/users/${encodeURIComponent(cleanUsername)}`);
  const user = await userResponse.json();
  let repos = [];
  const warnings = [];
  try {
    const result = await fetchPages(`/users/${encodeURIComponent(cleanUsername)}/repos?per_page=100&sort=updated&type=owner`);
    repos = result.items;
    if (result.truncated) warnings.push("Repository list is limited to the 500 most recently updated repositories.");
  } catch (error) {
    warnings.push(error.message || "Could not fetch the repository list.");
  }
  const languageCounts = {};
  const languageRepos = {};
  const topicCounts = {};
  let totalStars = 0;
  for (const repo of repos) {
    totalStars += repo.stargazers_count || 0;
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      languageRepos[repo.language] ||= [];
      if (languageRepos[repo.language].length < 3) languageRepos[repo.language].push(repo.name);
    }
    for (const topic of repo.topics || []) topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  }
  return {
    profile: {
      username: user.login, name: user.name || user.login, avatarUrl: user.avatar_url,
      bio: user.bio || "No public bio provided.", publicReposCount: user.public_repos,
      followersCount: user.followers, followingCount: user.following, totalStars,
      profileUrl: user.html_url, company: user.company || null, location: user.location || null,
    },
    analyzedReposCount: repos.length,
    detectedLanguages: Object.entries(languageCounts).sort((a, b) => b[1] - a[1]).map(([name, repoCount]) => ({ name, repoCount, sampleRepos: languageRepos[name] || [] })),
    detectedTopics: Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).map(([topic]) => topic),
    warnings,
  };
}

export async function fetchGitHubOrganizationRepositories(username) {
  const cleanUsername = String(username || "").trim();
  if (!cleanUsername || !/^[a-zA-Z0-9-]{1,39}$/.test(cleanUsername)) throw new GitHubApiError("Enter a valid GitHub organization username.", 400);
  const result = await fetchPages(`/orgs/${encodeURIComponent(cleanUsername)}/repos?per_page=100&sort=updated&type=public`, 5);
  return { repositories: result.items.map((repo) => repo.full_name).filter(Boolean), truncated: result.truncated };
}

export async function fetchGitHubRateLimit() {
  return (await githubRequest("/rate_limit")).json();
}



