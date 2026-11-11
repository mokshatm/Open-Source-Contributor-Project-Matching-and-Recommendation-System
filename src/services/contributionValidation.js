export const CONTRIBUTION_STATUSES = ["Saved", "In Progress", "PR Submitted", "Merged"];

function normalizeGitHubUrl(value, field) {
  let url;
  try { url = new URL(String(value || "")); } catch { throw Object.assign(new Error(`${field} must be a valid GitHub URL.`), { status: 400 }); }
  if (!["https:", "http:"].includes(url.protocol) || !["github.com", "www.github.com"].includes(url.hostname.toLowerCase())) {
    throw Object.assign(new Error(`${field} must link to github.com.`), { status: 400 });
  }
  return url;
}

export function normalizeOwnerUsername(value) {
  const username = String(value || "").trim();
  if (!/^[a-zA-Z0-9-]{1,39}$/.test(username)) throw Object.assign(new Error("A valid connected GitHub username is required."), { status: 400 });
  return username.toLowerCase();
}

export function validateContributionRecord(body, { partial = false } = {}) {
  const result = {};
  if (!partial || body.repositoryUrl !== undefined) {
    const url = normalizeGitHubUrl(body.repositoryUrl, "Repository link");
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[1]) parts[1] = parts[1].replace(/\.git$/i, "");
    if (parts.length < 2) throw Object.assign(new Error("Repository link must include owner and repository."), { status: 400 });
    result.repositoryUrl = `https://github.com/${parts[0]}/${parts[1]}`;
  }
  if (!partial || body.issueUrl !== undefined) {
    const url = normalizeGitHubUrl(body.issueUrl, "Issue link");
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[1]) parts[1] = parts[1].replace(/\.git$/i, "");
    if (parts.length < 4 || parts[2].toLowerCase() !== "issues" || !/^\d+$/.test(parts[3])) throw Object.assign(new Error("Issue link must be a GitHub issue URL."), { status: 400 });
    if (result.repositoryUrl && `${parts[0]}/${parts[1]}`.toLowerCase() !== result.repositoryUrl.replace("https://github.com/", "").toLowerCase()) {
      throw Object.assign(new Error("Issue and repository links must refer to the same repository."), { status: 400 });
    }
    result.issueUrl = `https://github.com/${parts[0]}/${parts[1]}/issues/${parts[3]}`;
  }
  if (body.status !== undefined || !partial) {
    if (!CONTRIBUTION_STATUSES.includes(body.status || "Saved")) throw Object.assign(new Error("Choose a supported contribution status."), { status: 400 });
    result.status = body.status || "Saved";
  }
  if (body.prUrl !== undefined || !partial) {
    const value = String(body.prUrl || "").trim();
    if (value) {
      const url = normalizeGitHubUrl(value, "Pull request URL");
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length < 4 || parts[2].toLowerCase() !== "pull" || !/^\d+$/.test(parts[3])) throw Object.assign(new Error("Pull request URL must be a GitHub pull request link."), { status: 400 });
      if (result.repositoryUrl && `${parts[0]}/${parts[1]}`.toLowerCase() !== result.repositoryUrl.replace("https://github.com/", "").toLowerCase()) {
        throw Object.assign(new Error("Pull request and repository links must refer to the same repository."), { status: 400 });
      }
      result.prUrl = `https://github.com/${parts[0]}/${parts[1]}/pull/${parts[3]}`;
    } else result.prUrl = null;
  }
  if (body.personalNotes !== undefined || !partial) {
    const notes = String(body.personalNotes || "");
    if (notes.length > 10000) throw Object.assign(new Error("Personal notes must be 10,000 characters or fewer."), { status: 400 });
    result.personalNotes = notes;
  }
  return result;
}

export function validateManualContributionPayload(body = {}) {
  const username = body.username ? normalizeOwnerUsername(body.username) : "";
  const record = validateContributionRecord({
    repositoryUrl: body.repository ?? body.repositoryUrl,
    issueUrl: body.issue_url ?? body.issueUrl,
    status: body.status,
    prUrl: body.pr_url ?? body.prUrl,
    personalNotes: body.notes ?? body.personalNotes,
  });
  const parts = new URL(record.repositoryUrl).pathname.split("/").filter(Boolean);
  const title = String(body.title || "").trim();
  if (title.length > 300) throw Object.assign(new Error("Issue title must be 300 characters or fewer."), { status: 400 });
  return { username, title, repoName: `${parts[0]}/${parts[1]}`, ...record };
}
