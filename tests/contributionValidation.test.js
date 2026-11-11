import test from "node:test";
import assert from "node:assert/strict";
import { validateManualContributionPayload } from "../src/services/contributionValidation.js";

test("manual contribution accepts standard URLs, trailing slashes, empty optional fields, and field aliases", () => {
  const result = validateManualContributionPayload({
    username: "Example-User",
    repository: "https://github.com/Owner/Project.git/",
    issue_url: "https://github.com/owner/project/issues/123/?source=tracker",
    status: "In Progress",
    pr_url: "",
    notes: "Start with the parser tests.",
  });

  assert.equal(result.username, "example-user");
  assert.equal(result.repositoryUrl, "https://github.com/Owner/Project");
  assert.equal(result.repoName, "Owner/Project");
  assert.equal(result.issueUrl, "https://github.com/owner/project/issues/123");
  assert.equal(result.status, "In Progress");
  assert.equal(result.prUrl, null);
  assert.equal(result.personalNotes, "Start with the parser tests.");
});

test("manual contribution validation does not accept a client username as its security identity", () => {
  const result = validateManualContributionPayload({
    repository: "https://github.com/owner/repo",
    issue_url: "https://github.com/owner/repo/issues/9",
    status: "Saved",
  });
  assert.equal(result.username, "");
  assert.equal(result.repoName, "owner/repo");
});

test("manual contribution rejects an issue from a different repository", () => {
  assert.throws(() => validateManualContributionPayload({
    username: "example-user",
    repository: "https://github.com/owner/repo",
    issue_url: "https://github.com/owner/other-repo/issues/12",
    status: "Saved",
    pr_url: "",
    notes: "",
  }), /must refer to the same repository/);
});

test("manual contribution reports invalid required GitHub URLs clearly", () => {
  assert.throws(() => validateManualContributionPayload({
    username: "example-user",
    repository: "https://example.com/owner/repo",
    issue_url: "https://github.com/owner/repo/issues/12",
    status: "Saved",
  }), /Repository link must link to github.com/);

  assert.throws(() => validateManualContributionPayload({
    username: "example-user",
    repository: "https://github.com/owner/repo",
    issue_url: "",
    status: "Saved",
  }), /Issue link must be a valid GitHub URL/);
});

test("manual contribution accepts an optional PR URL and canonicalizes its path", () => {
  const result = validateManualContributionPayload({
    username: "example-user",
    repository: "http://github.com/owner/repo/",
    issue_url: "https://github.com/owner/repo/issues/12/",
    status: "PR Submitted",
    pr_url: "https://github.com/owner/repo/pull/34/",
  });
  assert.equal(result.repositoryUrl, "https://github.com/owner/repo");
  assert.equal(result.prUrl, "https://github.com/owner/repo/pull/34");
});

test("manual contribution rejects a PR URL from a different repository", () => {
  assert.throws(() => validateManualContributionPayload({
    username: "example-user",
    repository: "https://github.com/owner/repo",
    issue_url: "https://github.com/owner/repo/issues/12",
    status: "PR Submitted",
    pr_url: "https://github.com/owner/other-repo/pull/34",
  }), /must refer to the same repository/);
});
