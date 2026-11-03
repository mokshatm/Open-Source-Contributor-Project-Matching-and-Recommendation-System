import test from "node:test";
import assert from "node:assert/strict";
import { matchIssueToDeveloper, recommendIssuesToDeveloper } from "../src/services/matching.js";

function issue({ skills = ["Python"], state = "open", difficulty = "Beginner", domain = "Backend" } = {}) {
  return {
    id: 1,
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

test("exact skill matches receive full skill compatibility", () => {
  const match = matchIssueToDeveloper(issue(), { skills: ["python"], experienceLevel: "Beginner", selectedDomains: ["Web Frameworks & APIs"] });
  assert.equal(match.eligibility.eligible, true);
  assert.deepEqual(match.matchedSkills, ["Python"]);
  assert.equal(match.components.skillCompatibility, 100);
  assert.ok(match.score >= 0 && match.score <= 100);
});

test("related skills count as partial compatibility and unrelated requirements remain unfamiliar", () => {
  const match = matchIssueToDeveloper(issue({ skills: ["Django", "React"] }), { skills: ["Python"] });
  assert.deepEqual(match.relatedSkills, ["Django"]);
  assert.deepEqual(match.missingSkills, ["React"]);
  assert.equal(match.components.skillCompatibility, 25);
});

test("unrelated profile skills have zero skill compatibility", () => {
  const match = matchIssueToDeveloper(issue(), { skills: ["Rust"] });
  assert.equal(match.components.skillCompatibility, 0);
  assert.deepEqual(match.missingSkills, ["Python"]);
});

test("a zero-skill-match score transparently reflects interest and experience inputs", () => {
  const match = matchIssueToDeveloper(issue(), {
    skills: ["Rust"],
    experienceLevel: "Beginner",
    selectedDomains: ["Web Frameworks & APIs"],
  });

  assert.equal(match.components.skillCompatibility, 0);
  assert.equal(match.components.interestAlignment, 100);
  assert.equal(match.components.experienceSuitability, 100);
  assert.equal(match.score, 60);
  assert.equal(match.scoreBreakdown.find((item) => item.component === "skillCompatibility").contribution, 0);
  assert.match(match.explanation, /no exact or related profile skill matches/);
});

test("missing profile fields yield an unknown score without throwing", () => {
  const match = matchIssueToDeveloper(issue(), {});
  assert.equal(match.score, null);
  assert.deepEqual(match.matchedSkills, []);
  assert.deepEqual(match.missingSkills, ["Python"]);
  assert.equal(match.components.experienceSuitability, null);
});

test("ineligible issues are excluded from scoring and recommendations", () => {
  const closedIssue = issue({ state: "closed" });
  const match = matchIssueToDeveloper(closedIssue, { skills: ["Python"] });
  assert.equal(match.eligibility.eligible, false);
  assert.equal(match.score, null);
  assert.match(match.explanation, /fails eligibility/);
  assert.deepEqual(recommendIssuesToDeveloper([closedIssue], { skills: ["Python"] }), []);
});

test("missing difficulty and incomplete extraction stay bounded and safe", () => {
  const item = issue({ difficulty: "Unknown" });
  item.requirementExtraction.status = "partial";
  const match = matchIssueToDeveloper(item, { skills: ["Python"] });
  assert.ok(match.score >= 0 && match.score <= 100);
  assert.equal(match.components.experienceSuitability, null);
});
