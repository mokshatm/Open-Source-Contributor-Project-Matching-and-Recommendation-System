import test from "node:test";
import assert from "node:assert/strict";
import { rankRecommendations } from "../src/services/ranking.js";

function candidate(id, { score = 50, skill = null, experience = null, updatedAt } = {}) {
  return {
    id,
    number: id,
    repoFullName: "example/project",
    updatedAt,
    eligibility: { eligible: true },
    match: {
      score,
      components: { skillCompatibility: skill, experienceSuitability: experience },
      explanation: `match explanation ${id}`,
      matchedSkills: [`skill-${id}`],
      relatedSkills: [`related-${id}`],
      unfamiliarSkills: [`unfamiliar-${id}`],
      scoreBreakdown: [{ component: "skillCompatibility", contribution: 20 }],
    },
  };
}

test("recommendations are ranked by descending known compatibility score", () => {
  const ranked = rankRecommendations([candidate(1, { score: 40 }), candidate(2, { score: 90 }), candidate(3, { score: 65 })]);
  assert.deepEqual(ranked.map((issue) => issue.id), [2, 3, 1]);
  assert.deepEqual(ranked.map((issue) => issue.rankingPosition), [1, 2, 3]);
});

test("score ties use skill fit, then experience, then reliable recency", () => {
  const ranked = rankRecommendations([
    candidate(1, { score: 80, skill: 60, experience: 100, updatedAt: "2026-01-01T00:00:00Z" }),
    candidate(2, { score: 80, skill: 80, experience: 55, updatedAt: "2025-01-01T00:00:00Z" }),
    candidate(3, { score: 80, skill: 60, experience: 100, updatedAt: "2026-05-01T00:00:00Z" }),
    candidate(4, { score: 80, skill: 60, experience: 100, updatedAt: "2026-05-01T00:00:00Z" }),
  ]);
  assert.deepEqual(ranked.map((issue) => issue.id), [2, 3, 4, 1]);
});

test("selected interest alignment breaks equal-score ties", () => {
  const aligned = candidate(2, { score: 80, skill: 20, experience: 20 });
  aligned.match.interestAlignment = { matchedInterests: ["Backend"] };
  const unaligned = candidate(1, { score: 80, skill: 20, experience: 20 });

  assert.deepEqual(rankRecommendations([unaligned, aligned]).map((issue) => issue.id), [2, 1]);
});

test("unknown scores follow known scores without being changed to zero", () => {
  const unknown = candidate(2, { score: null, skill: null });
  const ranked = rankRecommendations([unknown, candidate(1, { score: 0, skill: 0 })]);
  assert.deepEqual(ranked.map((issue) => issue.id), [1, 2]);
  assert.equal(ranked[1].match.score, null);
  assert.equal(ranked[1].rankingPosition, 2);
});

test("ineligible candidates are completely excluded", () => {
  const closed = { ...candidate(2, { score: 100 }), eligibility: { eligible: false } };
  const ranked = rankRecommendations([candidate(1, { score: 10 }), closed]);
  assert.deepEqual(ranked.map((issue) => issue.id), [1]);
});

test("ranking preserves Stage 5 details and adds only the position", () => {
  const source = candidate(7, { score: 73, skill: 50, experience: 100 });
  const ranked = rankRecommendations([source]);
  assert.equal(ranked[0].rankingPosition, 1);
  assert.deepEqual(ranked[0].match, source.match);
  assert.deepEqual(ranked[0].match.matchedSkills, ["skill-7"]);
  assert.deepEqual(ranked[0].match.relatedSkills, ["related-7"]);
  assert.deepEqual(ranked[0].match.unfamiliarSkills, ["unfamiliar-7"]);
  assert.deepEqual(ranked[0].match.scoreBreakdown, source.match.scoreBreakdown);
  assert.equal(ranked[0].match.explanation, source.match.explanation);
});
