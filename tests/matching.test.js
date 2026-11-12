import test from "node:test";
import assert from "node:assert/strict";
import { matchIssueToDeveloper, recommendIssuesToDeveloper } from "../src/services/matching.js";

const NOW = Date.parse("2026-01-01T00:00:00.000Z");

function issue({ skills = ["Python"], state = "open", difficulty = "Beginner", domain = "Backend" } = {}) {
  return {
    id: 1,
    updatedAt: "2026-01-01T00:00:00.000Z",
    title: "Improve the issue handler",
    url: "https://github.com/example/project/issues/1",
    state,
    body: "",
    eligibility: { eligible: state === "open", exclusionReasons: state === "open" ? [] : ["Issue is closed."] },
    requirementExtraction: {
      status: "complete",
      programmingLanguages: skills.map((name) => ({ name, classification: "explicit" })),
      frameworks: [], databases: [], technicalConcepts: [],
      domain: { primary: domain },
      estimatedDifficulty: { value: difficulty },
    },
  };
}

test("an exact skill match receives the full 50 skill points", () => {
  const match = matchIssueToDeveloper(issue(), { skills: ["python"], experienceLevel: "Beginner", selectedDomains: ["Web Frameworks & APIs"] }, { now: NOW });
  assert.equal(match.eligibility.eligible, true);
  assert.deepEqual(match.matchedSkills, ["Python"]);
  assert.equal(match.components.skillCompatibility, 50);
  assert.equal(match.components.experienceSuitability, 25);
  assert.equal(match.components.freshness, 20);
  assert.equal(match.score, 95);
});

test("related skills count as partial compatibility and unrelated requirements remain unfamiliar", () => {
  const match = matchIssueToDeveloper(issue({ skills: ["Django", "React"] }), { skills: ["Python"] }, { now: NOW });
  assert.deepEqual(match.relatedSkills, ["Django"]);
  assert.deepEqual(match.missingSkills, ["React"]);
  assert.equal(match.components.skillCompatibility, 13);
});

test("unrelated profile skills have zero skill compatibility", () => {
  const match = matchIssueToDeveloper(issue(), { skills: ["Rust"] }, { now: NOW });
  assert.equal(match.components.skillCompatibility, 0);
  assert.deepEqual(match.missingSkills, ["Python"]);
});

test("a zero-skill match still sums the defined experience and freshness components", () => {
  const match = matchIssueToDeveloper(issue(), {
    skills: ["Rust"],
    experienceLevel: "Beginner",
    selectedDomains: ["Web Frameworks & APIs"],
  }, { now: NOW });

  assert.equal(match.components.skillCompatibility, 0);
  assert.equal(match.components.interestAlignment, 100);
  assert.equal(match.components.experienceSuitability, 25);
  assert.equal(match.components.freshness, 20);
  assert.equal(match.score, 45);
  assert.equal(match.scoreBreakdown.find((item) => item.component === "skillCompatibility").contribution, 0);
  assert.match(match.explanation, /no exact or related profile skill matches/);
});

test("missing profile fields yield an unknown score without throwing", () => {
  const match = matchIssueToDeveloper(issue(), {}, { now: NOW });
  assert.equal(match.score, 35);
  assert.deepEqual(match.matchedSkills, []);
  assert.deepEqual(match.missingSkills, ["Python"]);
  assert.equal(match.components.experienceSuitability, 15);
});

test("ineligible issues are excluded from scoring and recommendations", () => {
  const closedIssue = issue({ state: "closed" });
  const match = matchIssueToDeveloper(closedIssue, { skills: ["Python"] }, { now: NOW });
  assert.equal(match.eligibility.eligible, false);
  assert.equal(match.score, null);
  assert.match(match.explanation, /fails eligibility/);
  assert.deepEqual(recommendIssuesToDeveloper([closedIssue], { skills: ["Python"] }), []);
});

test("missing difficulty and incomplete extraction stay bounded and safe", () => {
  const item = issue({ difficulty: "Unknown" });
  item.requirementExtraction.status = "partial";
  const match = matchIssueToDeveloper(item, { skills: ["Python"] }, { now: NOW });
  assert.ok(match.score >= 0 && match.score <= 100);
  assert.equal(match.components.experienceSuitability, 15);
});

test("repository language overlap uses its proportion of analyzed repositories", () => {
  const match = matchIssueToDeveloper(issue(), {
    analyzedReposCount: 50,
    detectedLanguages: [
      { name: "Python", repoCount: 37, sampleRepos: ["api"] },
      { name: "TypeScript", repoCount: 1, sampleRepos: ["ui"] },
    ],
  }, { now: NOW });

  assert.equal(match.components.skillCompatibility, 37);
  assert.equal(match.score, 72);
  assert.equal(match.score, match.scoreBreakdown.reduce((sum, item) => sum + item.score, 0));
});

test("high-frequency core skills lead direct matches and outweigh generic tags and minor tools", () => {
  const item = issue({ skills: ["Python", "FastAPI", "Docker", "Testing"] });
  const match = matchIssueToDeveloper(item, {
    analyzedReposCount: 50,
    detectedLanguages: [{ name: "Python", repoCount: 37, sampleRepos: ["api"] }],
    skills: [
      { name: "FastAPI", source: "repository", repoCount: 20 },
      { name: "Docker", source: "repository", repoCount: 5 },
      { name: "Testing", source: "repository", repoCount: 1 },
    ],
  }, { now: NOW });

  assert.deepEqual(match.matchedSkills, ["Python", "FastAPI", "Docker", "Testing"]);
  assert.equal(match.components.skillCompatibility, 15);
});

test("freshness decays linearly and good first issue labels boost suitable levels", () => {
  const item = issue({ difficulty: "Beginner" });
  item.updatedAt = "2025-01-01T00:00:00.000Z";
  item.labels = [{ name: "good first issue" }];
  const match = matchIssueToDeveloper(item, { skills: ["Python"], experienceLevel: "Intermediate" }, { now: NOW });

  assert.equal(match.components.skillCompatibility, 50);
  assert.equal(match.components.experienceSuitability, 18);
  assert.equal(match.components.freshness, 0);
  assert.equal(match.score, 68);
});
